"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { hasResultValue, validateResultValue } from "@/lib/laboratory-result/validation";
import { LAB_RESULT_ERROR_CODES } from "@/lib/laboratory-result/errors";
import {
  isResultCorrectable,
  isResultLocked,
  isResultReadyForVerification,
  REJECTION_REASON_CODES,
  type RejectionReasonCode,
} from "@/lib/laboratory-verification/constants";
import { LAB_VERIFICATION_ERROR_CODES } from "@/lib/laboratory-verification/errors";
import {
  allocateVerificationSequence,
  assertTenantOwnsVerificationResult,
  listCorrectionWorklist,
  listVerificationWorklist,
  resolveVerifierSnapshot,
} from "@/lib/laboratory-verification/queries";
import { serializeAffectedParameterIds } from "@/lib/laboratory-verification/parameter-ids";

export type LabVerificationActionResult =
  | { ok: true; resultId?: string; verificationId?: string; recordVersion?: number }
  | { ok: false; errorCode: string };

async function auditVerificationEvent(input: {
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
    entityType: "LabResultVerification",
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidateVerificationPaths(resultId?: string) {
  revalidatePath("/lab/verification");
  revalidatePath("/lab/corrections");
  revalidatePath("/lab/result-entry");
  if (resultId) {
    revalidatePath(`/lab/verification/${resultId}`);
    revalidatePath(`/lab/verification/${resultId}/history`);
    revalidatePath(`/lab/result-entry/${resultId}`);
    revalidatePath(`/lab/result-entry/${resultId}/edit`);
  }
}

function isSelfVerifier(result: { enteredById: string | null; entryCompletedById: string | null }, userId: string) {
  return result.enteredById === userId || result.entryCompletedById === userId;
}

async function assertCanVerify(
  result: Awaited<ReturnType<typeof assertTenantOwnsVerificationResult>>,
  session: Awaited<ReturnType<typeof requireTenantSession>>,
  selfApprovalOverride?: boolean,
  selfApprovalReason?: string,
) {
  if (session.branchId && result.branchId !== session.branchId) {
    return LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_BRANCH_ACCESS_DENIED;
  }
  if (!isResultReadyForVerification(result.status)) {
    return LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_RESULT_NOT_READY;
  }
  if (isResultLocked(result.status)) {
    return LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_ALREADY_VERIFIED;
  }
  for (const item of result.items) {
    if (item.isRequired && !hasResultValue({
      resultType: item.resultType,
      numericValue: item.numericValue != null ? Number(item.numericValue) : null,
      textValue: item.textValue,
      choiceValue: item.choiceValue,
      booleanValue: item.booleanValue,
      isRequired: item.isRequired,
    })) {
      return LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_REQUIRED_RESULT_MISSING;
    }
  }
  const unacknowledged = result.criticalEvents.filter((event) => !event.acknowledgedAt);
  if (unacknowledged.length > 0) {
    return LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_CRITICAL_UNACKNOWLEDGED;
  }
  if (isSelfVerifier(result, session.userId)) {
    if (!selfApprovalOverride) {
      return LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_SELF_APPROVAL_DENIED;
    }
    if (!selfApprovalReason?.trim()) {
      return LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_VALIDATION;
    }
  }
  return null;
}

export async function listVerificationWorklistAction() {
  const session = await requireTenantPermission("/lab/verification");
  return listVerificationWorklist(session.tenantId, session.branchId);
}

export async function listCorrectionWorklistAction() {
  const session = await requireTenantPermission("/lab/corrections");
  return listCorrectionWorklist(session.tenantId, session.branchId);
}

export async function getVerificationReviewAction(resultId: string) {
  const session = await requireTenantPermission("/lab/verification");
  return assertTenantOwnsVerificationResult(session.tenantId, resultId);
}

export async function getVerificationHistoryAction(resultId: string) {
  const session = await requireTenantPermission("/lab/verification/history");
  const result = await assertTenantOwnsVerificationResult(session.tenantId, resultId);
  return result.verifications;
}

export async function startVerificationReviewAction(resultId: string): Promise<LabVerificationActionResult> {
  await requireTenantPermission("/lab/verification/review", "canEdit");
  const session = await requireTenantSession();
  const result = await assertTenantOwnsVerificationResult(session.tenantId, resultId);

  await auditVerificationEvent({
    tenantId: session.tenantId,
    branchId: result.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_VERIFICATION_REVIEW_STARTED",
    entityId: resultId,
    changeData: { resultVersion: result.recordVersion },
  });

  return { ok: true, resultId };
}

export async function verifyLabResultAction(input: {
  resultId: string;
  recordVersion: number;
  verificationComment?: string;
  selfApprovalOverride?: boolean;
  selfApprovalReason?: string;
}): Promise<LabVerificationActionResult> {
  await requireTenantPermission("/lab/verification/verify", "canApprove");
  const session = await requireTenantSession();
  const result = await assertTenantOwnsVerificationResult(session.tenantId, input.resultId);

  if (result.recordVersion !== input.recordVersion) {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_VERSION_CONFLICT };
  }

  const guard = await assertCanVerify(result, session, input.selfApprovalOverride, input.selfApprovalReason);
  if (guard) return { ok: false, errorCode: guard };

  const verifier = await resolveVerifierSnapshot(session.tenantId, session.userId, session.user.name);

  const verification = await prisma.$transaction(async (tx) => {
    const current = await tx.labResult.findFirst({
      where: { id: input.resultId, tenantId: session.tenantId, status: "READY_FOR_VERIFICATION" },
    });
    if (!current) throw new Error(LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_RESULT_NOT_READY);

    const sequence = await allocateVerificationSequence(tx, input.resultId);
    const created = await tx.labResultVerification.create({
      data: {
        tenantId: session.tenantId,
        branchId: result.branchId,
        labResultId: input.resultId,
        verificationSequence: sequence,
        decision: "VERIFIED",
        verifierUserId: session.userId,
        verifierDisplayNameSnapshot: verifier.displayName,
        verifierDesignationSnapshot: verifier.designation,
        verifierRegistrationNumberSnapshot: verifier.registrationNumber,
        resultVersionReviewed: result.recordVersion,
        reviewStartedAt: new Date(),
        verifiedAt: new Date(),
        verificationComment: input.verificationComment?.trim() || null,
        selfApprovalOverride: Boolean(input.selfApprovalOverride),
        selfApprovalReason: input.selfApprovalReason?.trim() || null,
      },
    });

    await tx.labResult.update({
      where: { id: input.resultId },
      data: { status: "VERIFIED", recordVersion: { increment: 1 } },
    });

    await tx.labOrderTest.update({
      where: { id: result.labOrderTestId },
      data: { status: "COMPLETED" },
    });

    return created;
  });

  await auditVerificationEvent({
    tenantId: session.tenantId,
    branchId: result.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: input.selfApprovalOverride
      ? "LAB_VERIFICATION_SELF_APPROVAL_OVERRIDE"
      : "LAB_RESULT_VERIFIED",
    entityId: verification.id,
    changeData: {
      resultId: input.resultId,
      verificationSequence: verification.verificationSequence,
      resultVersion: result.recordVersion,
    },
  });

  revalidateVerificationPaths(input.resultId);
  return { ok: true, resultId: input.resultId, verificationId: verification.id };
}

export async function rejectLabResultForCorrectionAction(input: {
  resultId: string;
  recordVersion: number;
  reasonCode: RejectionReasonCode;
  reasonText: string;
  affectedParameterIds?: string[];
  verificationComment?: string;
}): Promise<LabVerificationActionResult> {
  await requireTenantPermission("/lab/verification/reject", "canApprove");
  const session = await requireTenantSession();
  const result = await assertTenantOwnsVerificationResult(session.tenantId, input.resultId);

  if (result.recordVersion !== input.recordVersion) {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_VERSION_CONFLICT };
  }

  if (!REJECTION_REASON_CODES.includes(input.reasonCode)) {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_VALIDATION };
  }
  if (!input.reasonText.trim()) {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_REJECTION_REASON_REQUIRED };
  }

  if (!isResultReadyForVerification(result.status)) {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_RESULT_NOT_READY };
  }

  const verifier = await resolveVerifierSnapshot(session.tenantId, session.userId, session.user.name);

  const verification = await prisma.$transaction(async (tx) => {
    const current = await tx.labResult.findFirst({
      where: { id: input.resultId, tenantId: session.tenantId, status: "READY_FOR_VERIFICATION" },
    });
    if (!current) throw new Error(LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_RESULT_NOT_READY);

    const sequence = await allocateVerificationSequence(tx, input.resultId);
    const created = await tx.labResultVerification.create({
      data: {
        tenantId: session.tenantId,
        branchId: result.branchId,
        labResultId: input.resultId,
        verificationSequence: sequence,
        decision: "REJECTED_FOR_CORRECTION",
        verifierUserId: session.userId,
        verifierDisplayNameSnapshot: verifier.displayName,
        verifierDesignationSnapshot: verifier.designation,
        verifierRegistrationNumberSnapshot: verifier.registrationNumber,
        resultVersionReviewed: result.recordVersion,
        reviewStartedAt: new Date(),
        rejectedAt: new Date(),
        verificationComment: input.verificationComment?.trim() || null,
        rejectionReasonCode: input.reasonCode,
        rejectionReasonText: input.reasonText.trim(),
        affectedParameterIds: serializeAffectedParameterIds(input.affectedParameterIds ?? []),
      },
    });

    await tx.labResultCorrectionRequest.create({
      data: {
        tenantId: session.tenantId,
        labResultId: input.resultId,
        verificationId: created.id,
        requestedById: session.userId,
        reasonCode: input.reasonCode,
        reasonText: input.reasonText.trim(),
        status: "OPEN",
      },
    });

    await tx.labResult.update({
      where: { id: input.resultId },
      data: { status: "REJECTED_FOR_CORRECTION", recordVersion: { increment: 1 } },
    });

    await tx.labOrderTest.update({
      where: { id: result.labOrderTestId },
      data: { status: "CORRECTION_REQUIRED" },
    });

    return created;
  });

  await auditVerificationEvent({
    tenantId: session.tenantId,
    branchId: result.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "LAB_RESULT_REJECTED_FOR_CORRECTION",
    entityId: verification.id,
    changeData: {
      resultId: input.resultId,
      reasonCode: input.reasonCode,
      affectedParameterCount: input.affectedParameterIds?.length ?? 0,
    },
  });

  revalidateVerificationPaths(input.resultId);
  return { ok: true, resultId: input.resultId, verificationId: verification.id };
}

export async function startLabResultCorrectionAction(correctionRequestId: string): Promise<LabVerificationActionResult> {
  await requireTenantPermission("/lab/corrections", "canEdit");
  const session = await requireTenantSession();

  const request = await prisma.labResultCorrectionRequest.findFirst({
    where: { id: correctionRequestId, tenantId: session.tenantId },
    include: { labResult: true },
  });
  if (!request) return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_CORRECTION_REQUEST_NOT_FOUND };
  if (request.status === "RESOLVED" || request.status === "CANCELLED") {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_CORRECTION_ALREADY_RESOLVED };
  }
  if (!isResultCorrectable(request.labResult.status)) {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_CORRECTION_INVALID_STATUS };
  }

  await prisma.$transaction(async (tx) => {
    await tx.labResultCorrectionRequest.update({
      where: { id: correctionRequestId },
      data: { status: "IN_PROGRESS" },
    });
    await tx.labResult.update({
      where: { id: request.labResultId },
      data: { status: "IN_PROGRESS" },
    });
    await tx.labOrderTest.update({
      where: { id: request.labResult.labOrderTestId },
      data: { status: "RESULT_IN_PROGRESS" },
    });
  });

  await auditVerificationEvent({
    tenantId: session.tenantId,
    branchId: request.labResult.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_CORRECTION_STARTED",
    entityId: correctionRequestId,
  });

  revalidateVerificationPaths(request.labResultId);
  return { ok: true, resultId: request.labResultId };
}

export async function resubmitCorrectedLabResultAction(input: {
  resultId: string;
  correctionRequestId: string;
  recordVersion: number;
  technicianNote?: string;
}): Promise<LabVerificationActionResult> {
  await requireTenantPermission("/lab/corrections/resubmit", "canEdit");
  const session = await requireTenantSession();
  const result = await assertTenantOwnsVerificationResult(session.tenantId, input.resultId);

  if (result.recordVersion !== input.recordVersion) {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_VERSION_CONFLICT };
  }
  if (!isResultCorrectable(result.status)) {
    return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_CORRECTION_INVALID_STATUS };
  }

  const request = await prisma.labResultCorrectionRequest.findFirst({
    where: {
      id: input.correctionRequestId,
      tenantId: session.tenantId,
      labResultId: input.resultId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });
  if (!request) return { ok: false, errorCode: LAB_VERIFICATION_ERROR_CODES.LAB_CORRECTION_REQUEST_NOT_FOUND };

  for (const item of result.items) {
    const validation = validateResultValue({
      resultType: item.resultType,
      numericValue: item.numericValue != null ? Number(item.numericValue) : null,
      textValue: item.textValue,
      choiceValue: item.choiceValue,
      booleanValue: item.booleanValue,
      decimalPlaces: item.decimalPlaces,
      isRequired: item.isRequired,
    });
    if (!validation.ok) return { ok: false, errorCode: validation.errorCode };
  }

  const unacknowledged = result.criticalEvents.filter((event) => !event.acknowledgedAt);
  if (unacknowledged.length > 0) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_CRITICAL_VALUE };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.labResultCorrectionRequest.update({
      where: { id: input.correctionRequestId },
      data: {
        status: "RESUBMITTED",
        technicianNote: input.technicianNote?.trim() || null,
        resolvedById: session.userId,
        resolvedAt: new Date(),
      },
    });

    const saved = await tx.labResult.update({
      where: { id: input.resultId },
      data: {
        status: "READY_FOR_VERIFICATION",
        entryCompletedById: session.userId,
        entryCompletedAt: new Date(),
        recordVersion: { increment: 1 },
      },
    });

    await tx.labOrderTest.update({
      where: { id: result.labOrderTestId },
      data: { status: "READY_FOR_VERIFICATION" },
    });

    return saved;
  });

  await auditVerificationEvent({
    tenantId: session.tenantId,
    branchId: result.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_CORRECTION_RESUBMITTED",
    entityId: input.correctionRequestId,
    changeData: { resultId: input.resultId },
  });

  revalidateVerificationPaths(input.resultId);
  return { ok: true, resultId: input.resultId, recordVersion: updated.recordVersion };
}
