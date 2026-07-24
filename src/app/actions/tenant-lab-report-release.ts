"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { assertReleaseEligibility, assertReleaseStatus } from "@/lib/laboratory-report-release/eligibility";
import { LAB_REPORT_RELEASE_ERROR_CODES } from "@/lib/laboratory-report-release/errors";
import { allocateReportNumber } from "@/lib/laboratory-report-release/number";
import {
  assertTenantOwnsRelease,
  assertTenantOwnsReleaseByResult,
  findVerificationToken,
  listReleaseHistory,
  listReleaseQueue,
} from "@/lib/laboratory-report-release/queries";
import {
  buildReportSnapshot,
  generateVerificationTokenValue,
  parseReportSnapshot,
  serializeReportSnapshot,
} from "@/lib/laboratory-report-release/snapshot";
import { generateReportPdfBuffer } from "@/lib/laboratory-report-release/pdf";
import { verificationReviewInclude } from "@/lib/laboratory-verification/queries";

export type LabReportReleaseActionResult =
  | { ok: true; releaseId?: string; reportNumber?: string; versionId?: string; token?: string }
  | { ok: false; errorCode: string };

async function auditReleaseEvent(input: {
  tenantId: string;
  branchId?: string;
  userId: string;
  actorName: string;
  actionType: "INSERT" | "UPDATE";
  event: string;
  entityId: string;
  changeData?: Record<string, unknown>;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    branchId: input.branchId,
    userId: input.userId,
    actionType: input.actionType,
    entityType: "LabReportRelease",
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidateReleasePaths(releaseId?: string, labResultId?: string) {
  revalidatePath("/lab/report-release");
  revalidatePath("/lab/report-release/history");
  if (releaseId) {
    revalidatePath(`/lab/report-release/${releaseId}`);
    revalidatePath(`/lab/report-release/${releaseId}/print`);
  }
  if (labResultId) {
    revalidatePath(`/lab/verification/${labResultId}`);
  }
}

async function loadReleaseResult(tenantId: string, labResultId: string) {
  const result = await prisma.labResult.findFirst({
    where: { id: labResultId, tenantId },
    include: verificationReviewInclude,
  });
  if (!result) return null;
  return result;
}

export async function listReleaseQueueAction() {
  const session = await requireTenantPermission("/lab/report-release");
  return listReleaseQueue(session.tenantId, session.branchId);
}

export async function listReleaseHistoryAction() {
  const session = await requireTenantPermission("/lab/report-release/history");
  return listReleaseHistory(session.tenantId, session.branchId);
}

export async function getReleaseDetailAction(releaseId: string) {
  const session = await requireTenantPermission("/lab/report-release");
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);
  if (session.branchId && release.branchId !== session.branchId) {
    throw new Error(LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED);
  }
  return release;
}

export async function prepareReleaseAction(
  labResultId: string,
  recordVersion: number,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/prepare", "canEdit");
  const session = await requireTenantSession();
  const result = await loadReleaseResult(session.tenantId, labResultId);
  if (!result) return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND };

  const eligibilityError = assertReleaseEligibility({
    result,
    branchId: session.branchId,
    expectedRecordVersion: recordVersion,
  });
  if (eligibilityError) return { ok: false, errorCode: eligibilityError };

  const existing = await assertTenantOwnsReleaseByResult(session.tenantId, labResultId);
  if (existing) {
    return { ok: true, releaseId: existing.id, reportNumber: existing.reportNumber };
  }

  const release = await prisma.$transaction(async (tx) => {
    const created = await tx.labReportRelease.create({
      data: {
        tenantId: session.tenantId,
        branchId: result.branchId,
        labResultId: result.id,
        reportNumber: `QUEUED-${result.id.slice(-12)}`,
        status: "RELEASE_PENDING",
        resultVersionSnapshot: result.recordVersion,
        createdById: session.userId,
        updatedById: session.userId,
      },
    });

    await tx.labResult.update({
      where: { id: result.id },
      data: { status: "RELEASE_PENDING" },
    });

    return created;
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: result.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "LAB_REPORT_RELEASE_PREPARED",
    entityId: release.id,
    changeData: { labResultId, recordVersion },
  });

  revalidateReleasePaths(release.id, labResultId);
  return { ok: true, releaseId: release.id };
}

export async function authorizeReleaseAction(
  releaseId: string,
  recordVersion: number,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/release", "canApprove");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);

  if (session.branchId && release.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED };
  }

  const statusError = assertReleaseStatus(release.status, ["RELEASE_PENDING", "AMENDED"]);
  if (statusError) return { ok: false, errorCode: statusError };

  const eligibilityError = assertReleaseEligibility({
    result: release.labResult,
    branchId: session.branchId,
    expectedRecordVersion: recordVersion,
  });
  if (eligibilityError) return { ok: false, errorCode: eligibilityError };

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { tenantName: true, logoUrl: true, reportHeaderLogoUrl: true },
  });
  if (!tenant) return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND };

  const now = new Date();
  const nextVersionNumber = (release.versions[0]?.versionNumber ?? 0) + 1;
  const amendmentReason =
    release.status === "AMENDED" ? release.versions.find((v) => v.isCurrent)?.amendmentReason ?? null : null;

  const outcome = await prisma.$transaction(async (tx) => {
    const reportNumber = await allocateReportNumber(tx, session.tenantId);
    const snapshot = buildReportSnapshot({
      result: release.labResult,
      tenant,
      reportNumber,
      versionNumber: nextVersionNumber,
      amendmentReason,
      releasedAt: now,
    });

    if (release.currentVersionId) {
      await tx.labReportVersion.updateMany({
        where: { releaseId: release.id, isCurrent: true },
        data: { isCurrent: false, status: "SUPERSEDED" },
      });
    }

    const version = await tx.labReportVersion.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionNumber: nextVersionNumber,
        status: "RELEASED",
        isCurrent: true,
        snapshotJson: serializeReportSnapshot(snapshot),
        amendmentReason,
        amendedFromId: release.currentVersionId,
        releasedById: session.userId,
        releasedAt: now,
        createdById: session.userId,
      },
    });

    await tx.labReportVerificationToken.updateMany({
      where: { releaseId: release.id, isRevoked: false },
      data: { isRevoked: true },
    });

    const tokenValue = generateVerificationTokenValue();
    await tx.labReportVerificationToken.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionId: version.id,
        token: tokenValue,
      },
    });

    const updatedRelease = await tx.labReportRelease.update({
      where: { id: release.id },
      data: {
        reportNumber,
        status: "RELEASED",
        resultVersionSnapshot: release.labResult.recordVersion,
        currentVersionId: version.id,
        portalPublishEligible: true,
        releasedById: session.userId,
        releasedAt: now,
        updatedById: session.userId,
      },
    });

    await tx.labResult.update({
      where: { id: release.labResultId },
      data: { status: "RELEASED" },
    });

    await tx.labReportDelivery.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionId: version.id,
        deliveryMethod: "PORTAL",
        deliveredTo: release.labResult.labOrder.patient.fullName,
        deliveredById: session.userId,
        referenceNote: "Release authorization",
      },
    });

    return { updatedRelease, version, tokenValue, reportNumber };
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_RELEASED",
    entityId: release.id,
    changeData: {
      reportNumber: outcome.reportNumber,
      versionNumber: nextVersionNumber,
      recordVersion,
    },
  });

  revalidateReleasePaths(release.id, release.labResultId);
  return {
    ok: true,
    releaseId: release.id,
    reportNumber: outcome.reportNumber,
    versionId: outcome.version.id,
    token: outcome.tokenValue,
  };
}

export async function printReportAction(
  releaseId: string,
  reprintReason?: string,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/print", "canPrint");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);

  if (session.branchId && release.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED };
  }

  const statusError = assertReleaseStatus(release.status, ["RELEASED"]);
  if (statusError) return { ok: false, errorCode: statusError };
  if (!release.currentVersion) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND };
  }

  const isReprint = release.printCount > 0;
  if (isReprint && !reprintReason?.trim()) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_REPRINT_REASON_REQUIRED };
  }

  await prisma.$transaction(async (tx) => {
    await tx.labReportRelease.update({
      where: { id: release.id },
      data: { printCount: { increment: 1 } },
    });

    await tx.labReportAccessAudit.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionId: release.currentVersion!.id,
        accessMethod: "PRINT",
        accessedBy: session.userId,
      },
    });

    if (isReprint) {
      await tx.labReportReprintAudit.create({
        data: {
          tenantId: session.tenantId,
          branchId: release.branchId,
          releaseId: release.id,
          versionId: release.currentVersion!.id,
          reprintedById: session.userId,
          reason: reprintReason!.trim(),
        },
      });
    }

    await tx.labReportDelivery.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionId: release.currentVersion!.id,
        deliveryMethod: "PRINT",
        deliveredTo: release.labResult.labOrder.patient.fullName,
        deliveredById: session.userId,
        referenceNote: isReprint ? reprintReason!.trim() : "Initial print",
      },
    });
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: isReprint ? "LAB_REPORT_REPRINTED" : "LAB_REPORT_PRINTED",
    entityId: release.id,
    changeData: { versionId: release.currentVersion.id, reprintReason: reprintReason ?? null },
  });

  revalidateReleasePaths(release.id);
  return { ok: true, releaseId: release.id };
}

export async function downloadReportPdfAction(
  releaseId: string,
): Promise<{ ok: true; fileName: string; base64: string } | { ok: false; errorCode: string }> {
  await requireTenantPermission("/lab/report-release/download", "canPrint");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);

  if (session.branchId && release.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED };
  }

  const statusError = assertReleaseStatus(release.status, ["RELEASED"]);
  if (statusError) return { ok: false, errorCode: statusError };
  if (!release.currentVersion) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND };
  }

  const snapshot = parseReportSnapshot(release.currentVersion.snapshotJson);
  const pdfBuffer = generateReportPdfBuffer(snapshot);

  await prisma.$transaction(async (tx) => {
    await tx.labReportRelease.update({
      where: { id: release.id },
      data: { downloadCount: { increment: 1 } },
    });

    await tx.labReportAccessAudit.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionId: release.currentVersion!.id,
        accessMethod: "PDF_DOWNLOAD",
        accessedBy: session.userId,
      },
    });

    await tx.labReportDelivery.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionId: release.currentVersion!.id,
        deliveryMethod: "DOWNLOAD",
        deliveredTo: release.labResult.labOrder.patient.fullName,
        deliveredById: session.userId,
      },
    });
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_DOWNLOADED",
    entityId: release.id,
    changeData: { versionId: release.currentVersion.id },
  });

  return {
    ok: true,
    fileName: `${snapshot.reportNumber}.pdf`,
    base64: pdfBuffer.toString("base64"),
  };
}

export async function publishPortalAction(releaseId: string): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/portal-publish", "canApprove");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);

  if (session.branchId && release.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED };
  }

  if (release.status !== "RELEASED") {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_RELEASED };
  }
  if (!release.portalPublishEligible) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_PORTAL_NOT_ELIGIBLE };
  }
  if (release.portalPublishedAt) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_PORTAL_ALREADY_PUBLISHED };
  }

  const now = new Date();
  await prisma.labReportRelease.update({
    where: { id: release.id },
    data: {
      portalPublishedAt: now,
      portalPublishedById: session.userId,
      updatedById: session.userId,
    },
  });

  if (release.currentVersion) {
    await prisma.labReportDelivery.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionId: release.currentVersion.id,
        deliveryMethod: "PORTAL",
        deliveredTo: release.labResult.labOrder.patient.fullName,
        deliveredById: session.userId,
        referenceNote: "Portal publish flag set for MOD-30",
      },
    });
  }

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_PORTAL_PUBLISHED",
    entityId: release.id,
  });

  revalidateReleasePaths(release.id);
  return { ok: true, releaseId: release.id };
}

export async function withdrawReleaseAction(
  releaseId: string,
  reason: string,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/withdraw", "canApprove");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);

  if (session.branchId && release.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED };
  }

  const statusError = assertReleaseStatus(release.status, ["RELEASED"]);
  if (statusError) return { ok: false, errorCode: statusError };
  if (!reason.trim()) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_WITHDRAWAL_REASON_REQUIRED };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.labReportRelease.update({
      where: { id: release.id },
      data: {
        status: "WITHDRAWN",
        portalPublishEligible: false,
        withdrawnAt: now,
        withdrawnById: session.userId,
        withdrawalReason: reason.trim(),
        updatedById: session.userId,
      },
    });

    if (release.currentVersionId) {
      await tx.labReportVersion.update({
        where: { id: release.currentVersionId },
        data: { status: "WITHDRAWN" },
      });
    }

    await tx.labReportVerificationToken.updateMany({
      where: { releaseId: release.id, isRevoked: false },
      data: { isRevoked: true },
    });

    await tx.labResult.update({
      where: { id: release.labResultId },
      data: { status: "VERIFIED" },
    });
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_WITHDRAWN",
    entityId: release.id,
    changeData: { reason: reason.trim() },
  });

  revalidateReleasePaths(release.id, release.labResultId);
  return { ok: true, releaseId: release.id };
}

export async function initiateAmendmentAction(
  releaseId: string,
  reason: string,
  recordVersion: number,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/amend", "canApprove");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);

  if (session.branchId && release.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED };
  }

  const statusError = assertReleaseStatus(release.status, ["RELEASED"]);
  if (statusError) return { ok: false, errorCode: statusError };
  if (!reason.trim()) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_AMENDMENT_REASON_REQUIRED };
  }

  const openCorrection = release.labResult.correctionRequests.some((request) =>
    ["OPEN", "IN_PROGRESS"].includes(request.status),
  );
  if (openCorrection) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_CORRECTION_PENDING };
  }

  await prisma.$transaction(async (tx) => {
    await tx.labReportRelease.update({
      where: { id: release.id },
      data: {
        status: "AMENDED",
        portalPublishEligible: false,
        portalPublishedAt: null,
        portalPublishedById: null,
        updatedById: session.userId,
      },
    });

    await tx.labReportVersion.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionNumber: (release.versions[0]?.versionNumber ?? 0) + 1,
        status: "DRAFT",
        isCurrent: false,
        snapshotJson: release.currentVersion?.snapshotJson ?? "{}",
        amendmentReason: reason.trim(),
        amendedFromId: release.currentVersionId,
        createdById: session.userId,
      },
    });

    await tx.labResult.update({
      where: { id: release.labResultId },
      data: { status: "RELEASE_PENDING" },
    });
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_AMENDED",
    entityId: release.id,
    changeData: { reason: reason.trim(), recordVersion },
  });

  revalidateReleasePaths(release.id, release.labResultId);
  return { ok: true, releaseId: release.id };
}

export async function verifyReportTokenAction(token: string) {
  const record = await findVerificationToken(token);
  if (!record) {
    return { ok: false as const, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERIFICATION_TOKEN_INVALID };
  }
  if (record.isRevoked || record.release.status === "WITHDRAWN") {
    return { ok: false as const, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERIFICATION_TOKEN_REVOKED };
  }
  if (record.expiresAt && record.expiresAt < new Date()) {
    return { ok: false as const, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERIFICATION_TOKEN_EXPIRED };
  }

  await prisma.labReportAccessAudit.create({
    data: {
      tenantId: record.tenantId,
      branchId: record.branchId,
      releaseId: record.releaseId,
      versionId: record.versionId,
      accessMethod: "QR_VERIFY",
      accessedBy: "PUBLIC_QR",
    },
  });

  await writeAuditLog({
    tenantId: record.tenantId,
    branchId: record.branchId,
    actionType: "UPDATE",
    entityType: "LabReportVerificationToken",
    entityId: record.id,
    changeData: { event: "LAB_REPORT_QR_VERIFIED", reportNumber: record.release.reportNumber },
    createdBy: "PUBLIC_QR",
  });

  return {
    ok: true as const,
    reportNumber: record.release.reportNumber,
    releaseStatus: record.release.status,
    versionNumber: record.version.versionNumber,
    portalPublishEligible: record.release.portalPublishEligible,
    isValid: record.release.status === "RELEASED",
  };
}

export async function getReportSnapshotForPrintAction(releaseId: string) {
  const session = await requireTenantPermission("/lab/report-release/print", "canPrint");
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);
  if (session.branchId && release.branchId !== session.branchId) {
    throw new Error(LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED);
  }
  if (!release.currentVersion) {
    throw new Error(LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND);
  }
  return {
    release,
    snapshot: parseReportSnapshot(release.currentVersion.snapshotJson),
    verificationToken: release.verificationTokens[0]?.token ?? null,
  };
}
