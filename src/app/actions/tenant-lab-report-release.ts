"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import {
  evaluateReportReleaseEligibility,
  firstBlockingErrorCode,
  assertReleaseStatus,
} from "@/lib/laboratory-report-release/eligibility";
import { LAB_REPORT_RELEASE_ERROR_CODES } from "@/lib/laboratory-report-release/errors";
import { allocateReportNumber } from "@/lib/laboratory-report-release/number";
import { loadReportReleasePolicy } from "@/lib/laboratory-report-release/policy";
import {
  assertTenantOwnsRelease,
  assertTenantOwnsReleaseByResult,
  findVerificationToken,
  listReleaseHistory,
  listReleaseQueue,
} from "@/lib/laboratory-report-release/queries";
import { generateQrSvgDataUrl } from "@/lib/laboratory-report-release/qr";
import {
  buildReportSnapshot,
  generateVerificationTokenValue,
  parseReportSnapshot,
  serializeReportSnapshot,
} from "@/lib/laboratory-report-release/snapshot";
import { generateReportPdfBuffer } from "@/lib/laboratory-report-release/pdf";
import { buildReportVerificationUrl } from "@/lib/laboratory-report-release/verification-url";
import type { ReportReleaseEligibility } from "@/lib/laboratory-report-release/types";
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

function releaseEligibilityContext(release: {
  id: string;
  status: import("@/generated/prisma/client").LabReportReleaseStatus;
  stateVersion: number;
  resultVersionSnapshot: number;
  billingHoldActive: boolean;
  qualityHoldActive: boolean;
}) {
  return {
    id: release.id,
    status: release.status,
    stateVersion: release.stateVersion,
    resultVersionSnapshot: release.resultVersionSnapshot,
    billingHoldActive: release.billingHoldActive,
    qualityHoldActive: release.qualityHoldActive,
  };
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

export async function getReleaseEligibilityAction(input: {
  labResultId?: string;
  releaseId?: string;
  recordVersion?: number;
  stateVersion?: number;
  phase?: "prepare" | "authorize";
}): Promise<ReportReleaseEligibility> {
  const session = await requireTenantPermission("/lab/report-release");
  const policy = await loadReportReleasePolicy(session.tenantId);
  const phase = input.phase ?? (input.releaseId ? "authorize" : "prepare");

  let result = null;
  let release = null;

  if (input.releaseId) {
    release = await assertTenantOwnsRelease(session.tenantId, input.releaseId);
    result = release.labResult;
  } else if (input.labResultId) {
    result = await loadReleaseResult(session.tenantId, input.labResultId);
    release = result ? await assertTenantOwnsReleaseByResult(session.tenantId, input.labResultId) : null;
  }

  return evaluateReportReleaseEligibility({
    tenantId: session.tenantId,
    branchId: session.branchId,
    result,
    release: release ? releaseEligibilityContext(release) : null,
    expectedRecordVersion: input.recordVersion,
    expectedStateVersion: input.stateVersion,
    policy,
    hasPermission: true,
    phase,
  });
}

export async function prepareReleaseAction(
  labResultId: string,
  recordVersion: number,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/prepare", "canEdit");
  const session = await requireTenantSession();
  const policy = await loadReportReleasePolicy(session.tenantId);
  const result = await loadReleaseResult(session.tenantId, labResultId);
  if (!result) return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND };

  const existing = await assertTenantOwnsReleaseByResult(session.tenantId, labResultId);
  const eligibility = evaluateReportReleaseEligibility({
    tenantId: session.tenantId,
    branchId: session.branchId,
    result,
    release: existing ? releaseEligibilityContext(existing) : null,
    expectedRecordVersion: recordVersion,
    policy,
    hasPermission: true,
    phase: "prepare",
  });
  const eligibilityError = firstBlockingErrorCode(eligibility);
  if (eligibilityError) {
    if (existing && eligibilityError === LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_ALREADY_RELEASED) {
      return { ok: true, releaseId: existing.id, reportNumber: existing.reportNumber };
    }
    await auditReleaseEvent({
      tenantId: session.tenantId,
      branchId: result.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: "UPDATE",
      event: "LAB_REPORT_RELEASE_ELIGIBILITY_FAILED",
      entityId: existing?.id ?? labResultId,
      changeData: { phase: "prepare", codes: eligibility.blockingReasons.map((r) => r.code) },
    });
    return { ok: false, errorCode: eligibilityError };
  }

  if (existing) {
    return { ok: true, releaseId: existing.id, reportNumber: existing.reportNumber };
  }

  const release = await prisma.$transaction(async (tx) => {
    const duplicate = await tx.labReportRelease.findFirst({
      where: { tenantId: session.tenantId, labResultId: result.id },
    });
    if (duplicate) return duplicate;

    return tx.labReportRelease.create({
      data: {
        tenantId: session.tenantId,
        branchId: result.branchId,
        labResultId: result.id,
        reportNumber: `QUEUED-${result.id.slice(-12)}`,
        status: "RELEASE_PENDING",
        resultVersionSnapshot: result.recordVersion,
        stateVersion: 1,
        createdById: session.userId,
        updatedById: session.userId,
      },
    });
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
  stateVersion?: number,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/release", "canApprove");
  const session = await requireTenantSession();
  const policy = await loadReportReleasePolicy(session.tenantId);
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);

  if (session.branchId && release.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED };
  }

  const eligibility = evaluateReportReleaseEligibility({
    tenantId: session.tenantId,
    branchId: session.branchId,
    result: release.labResult,
    release: releaseEligibilityContext(release),
    expectedRecordVersion: recordVersion,
    expectedStateVersion: stateVersion ?? release.stateVersion,
    policy,
    hasPermission: true,
    phase: "authorize",
  });
  const eligibilityError = firstBlockingErrorCode(eligibility);
  if (eligibilityError) {
    await auditReleaseEvent({
      tenantId: session.tenantId,
      branchId: release.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: "UPDATE",
      event: "LAB_REPORT_RELEASE_ELIGIBILITY_FAILED",
      entityId: release.id,
      changeData: { phase: "authorize", codes: eligibility.blockingReasons.map((r) => r.code) },
    });
    return { ok: false, errorCode: eligibilityError };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { tenantName: true, logoUrl: true, reportHeaderLogoUrl: true },
  });
  if (!tenant) return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND };

  const now = new Date();
  const nextVersionNumber = (release.versions[0]?.versionNumber ?? 0) + 1;
  const amendmentReason =
    release.status === "AMENDED" ? release.versions.find((v) => v.isCurrent)?.amendmentReason ?? null : null;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const locked = await tx.labReportRelease.updateMany({
        where: {
          id: release.id,
          tenantId: session.tenantId,
          stateVersion: stateVersion ?? release.stateVersion,
          status: { in: ["RELEASE_PENDING", "AMENDED"] },
        },
        data: {
          updatedById: session.userId,
          stateVersion: { increment: 1 },
        },
      });
      if (locked.count !== 1) {
        throw new Error(LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_STATE_CHANGED);
      }

      const freshRelease = await tx.labReportRelease.findUniqueOrThrow({
        where: { id: release.id },
        include: { labResult: { include: verificationReviewInclude } },
      });

      const recheck = evaluateReportReleaseEligibility({
        tenantId: session.tenantId,
        branchId: session.branchId,
        result: freshRelease.labResult,
        release: releaseEligibilityContext(freshRelease),
        expectedRecordVersion: recordVersion,
        policy,
        hasPermission: true,
        phase: "authorize",
      });
      const recheckError = firstBlockingErrorCode(recheck);
      if (recheckError) throw new Error(recheckError);

      const reportNumber = await allocateReportNumber(tx, session.tenantId);
      const snapshot = buildReportSnapshot({
        result: freshRelease.labResult,
        tenant,
        reportNumber,
        versionNumber: nextVersionNumber,
        amendmentReason,
        releasedAt: now,
      });

      if (freshRelease.currentVersionId) {
        await tx.labReportVersion.updateMany({
          where: { releaseId: freshRelease.id, isCurrent: true },
          data: { isCurrent: false, status: "SUPERSEDED" },
        });
      }

      const version = await tx.labReportVersion.create({
        data: {
          tenantId: session.tenantId,
          branchId: freshRelease.branchId,
          releaseId: freshRelease.id,
          versionNumber: nextVersionNumber,
          status: "RELEASED",
          isCurrent: true,
          snapshotJson: serializeReportSnapshot(snapshot),
          amendmentReason,
          amendedFromId: freshRelease.currentVersionId,
          releasedById: session.userId,
          releasedAt: now,
          createdById: session.userId,
        },
      });

      await tx.labReportVerificationToken.updateMany({
        where: { releaseId: freshRelease.id, isRevoked: false },
        data: { isRevoked: true },
      });

      const tokenValue = generateVerificationTokenValue();
      await tx.labReportVerificationToken.create({
        data: {
          tenantId: session.tenantId,
          branchId: freshRelease.branchId,
          releaseId: freshRelease.id,
          versionId: version.id,
          token: tokenValue,
        },
      });

      const updatedRelease = await tx.labReportRelease.update({
        where: { id: freshRelease.id },
        data: {
          reportNumber,
          status: "RELEASED",
          resultVersionSnapshot: freshRelease.labResult.recordVersion,
          currentVersionId: version.id,
          portalPublishEligible: true,
          releasedById: session.userId,
          releasedAt: now,
          updatedById: session.userId,
        },
      });

      await tx.labReportDelivery.create({
        data: {
          tenantId: session.tenantId,
          branchId: freshRelease.branchId,
          releaseId: freshRelease.id,
          versionId: version.id,
          deliveryMethod: "PORTAL",
          deliveredTo: freshRelease.labResult.labOrder.patient.fullName,
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

    await auditReleaseEvent({
      tenantId: session.tenantId,
      branchId: release.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: "UPDATE",
      event: "LAB_REPORT_QR_GENERATED",
      entityId: release.id,
      changeData: { versionNumber: nextVersionNumber },
    });

    revalidateReleasePaths(release.id, release.labResultId);
    return {
      ok: true,
      releaseId: release.id,
      reportNumber: outcome.reportNumber,
      versionId: outcome.version.id,
      token: outcome.tokenValue,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = Object.values(LAB_REPORT_RELEASE_ERROR_CODES).includes(
      message as (typeof LAB_REPORT_RELEASE_ERROR_CODES)[keyof typeof LAB_REPORT_RELEASE_ERROR_CODES],
    )
      ? message
      : LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_STATE_CHANGED;
    return { ok: false, errorCode: code };
  }
}

export async function addBillingHoldAction(
  releaseId: string,
  reason: string,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/billing-hold", "canApprove");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);
  if (!reason.trim()) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_HOLD_REASON_REQUIRED };
  }

  const now = new Date();
  await prisma.labReportRelease.update({
    where: { id: release.id },
    data: {
      billingHoldActive: true,
      billingHoldReason: reason.trim(),
      billingHoldAt: now,
      billingHoldById: session.userId,
      billingHoldClearedAt: null,
      billingHoldClearedById: null,
      billingHoldClearReason: null,
      stateVersion: { increment: 1 },
      updatedById: session.userId,
    },
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_BILLING_HOLD_DETECTED",
    entityId: release.id,
    changeData: { holdType: "MANUAL_BILLING" },
  });

  revalidateReleasePaths(release.id);
  return { ok: true, releaseId: release.id };
}

export async function clearBillingHoldAction(
  releaseId: string,
  clearReason: string,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/billing-hold", "canApprove");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);
  if (!release.billingHoldActive) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_HOLD_NOT_ACTIVE };
  }
  if (!clearReason.trim()) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_HOLD_REASON_REQUIRED };
  }

  await prisma.labReportRelease.update({
    where: { id: release.id },
    data: {
      billingHoldActive: false,
      billingHoldClearedAt: new Date(),
      billingHoldClearedById: session.userId,
      billingHoldClearReason: clearReason.trim(),
      stateVersion: { increment: 1 },
      updatedById: session.userId,
    },
  });

  revalidateReleasePaths(release.id);
  return { ok: true, releaseId: release.id };
}

export async function addQualityHoldAction(
  releaseId: string,
  reason: string,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/quality-hold", "canApprove");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);
  if (!reason.trim()) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_HOLD_REASON_REQUIRED };
  }

  await prisma.labReportRelease.update({
    where: { id: release.id },
    data: {
      qualityHoldActive: true,
      qualityHoldReason: reason.trim(),
      qualityHoldAt: new Date(),
      qualityHoldById: session.userId,
      qualityHoldClearedAt: null,
      qualityHoldClearedById: null,
      qualityHoldClearReason: null,
      stateVersion: { increment: 1 },
      updatedById: session.userId,
    },
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_QUALITY_HOLD_ADDED",
    entityId: release.id,
  });

  revalidateReleasePaths(release.id);
  return { ok: true, releaseId: release.id };
}

export async function clearQualityHoldAction(
  releaseId: string,
  clearReason: string,
): Promise<LabReportReleaseActionResult> {
  await requireTenantPermission("/lab/report-release/quality-hold", "canApprove");
  const session = await requireTenantSession();
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);
  if (!release.qualityHoldActive) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_HOLD_NOT_ACTIVE };
  }
  if (!clearReason.trim()) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_HOLD_REASON_REQUIRED };
  }

  await prisma.labReportRelease.update({
    where: { id: release.id },
    data: {
      qualityHoldActive: false,
      qualityHoldClearedAt: new Date(),
      qualityHoldClearedById: session.userId,
      qualityHoldClearReason: clearReason.trim(),
      stateVersion: { increment: 1 },
      updatedById: session.userId,
    },
  });

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_QUALITY_HOLD_CLEARED",
    entityId: release.id,
  });

  revalidateReleasePaths(release.id);
  return { ok: true, releaseId: release.id };
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
  const token = release.verificationTokens[0]?.token ?? null;
  const pdfBuffer = await generateReportPdfBuffer(snapshot, token);

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
  const policy = await loadReportReleasePolicy(session.tenantId);
  const release = await assertTenantOwnsRelease(session.tenantId, releaseId);

  if (session.branchId && release.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED };
  }

  const eligibility = evaluateReportReleaseEligibility({
    tenantId: session.tenantId,
    branchId: session.branchId,
    result: release.labResult,
    release: releaseEligibilityContext(release),
    policy,
    hasPermission: true,
    phase: "portal",
  });
  const eligibilityError = firstBlockingErrorCode(eligibility);
  if (eligibilityError) return { ok: false, errorCode: eligibilityError };

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
        stateVersion: { increment: 1 },
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

  await auditReleaseEvent({
    tenantId: session.tenantId,
    branchId: release.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_REPORT_QR_REVOKED",
    entityId: release.id,
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
        stateVersion: { increment: 1 },
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

  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recentAttempts = await prisma.labReportAccessAudit.count({
    where: {
      releaseId: record.releaseId,
      accessMethod: "QR_VERIFY",
      accessedAt: { gte: oneMinuteAgo },
    },
  });
  if (recentAttempts > 30) {
    return { ok: false as const, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERIFICATION_RATE_LIMITED };
  }

  if (record.isRevoked || record.release.status === "WITHDRAWN") {
    return { ok: false as const, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERIFICATION_TOKEN_REVOKED };
  }
  if (record.expiresAt && record.expiresAt < new Date()) {
    return { ok: false as const, errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERIFICATION_TOKEN_EXPIRED };
  }
  if (
    !record.version.isCurrent ||
    record.version.status === "SUPERSEDED" ||
    record.release.currentVersionId !== record.version.id
  ) {
    return {
      ok: false as const,
      errorCode: LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERIFICATION_TOKEN_SUPERSEDED,
    };
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
    isSuperseded: false,
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

  const token = release.verificationTokens[0]?.token ?? null;
  const verificationUrl = token ? buildReportVerificationUrl(token) : null;
  const qrDataUrl = token ? await generateQrSvgDataUrl(token) : null;

  return {
    release,
    snapshot: parseReportSnapshot(release.currentVersion.snapshotJson),
    verificationToken: token,
    verificationUrl,
    qrDataUrl,
  };
}
