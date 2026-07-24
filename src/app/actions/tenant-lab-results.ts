"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type LabResultStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { calculateAgeInDays } from "@/lib/laboratory-result/age";
import { computeAbnormalFlag } from "@/lib/laboratory-result/abnormal-flags";
import {
  canReopenLabResult,
  canTransitionLabResultStatus,
  isLabResultCorrectable,
  isLabResultEditable,
} from "@/lib/laboratory-result/constants";
import { LAB_RESULT_ERROR_CODES } from "@/lib/laboratory-result/errors";
import {
  assertTenantOwnsLabResult,
  findActiveLabResultForOrderTest,
  listResultEntryWorklist,
} from "@/lib/laboratory-result/queries";
import { selectReferenceRange } from "@/lib/laboratory-result/range-selection";
import { validateResultValue } from "@/lib/laboratory-result/validation";

export type LabResultActionResult =
  | { ok: true; resultId?: string; recordVersion?: number }
  | { ok: false; errorCode: string };

export type SaveLabResultItemInput = {
  itemId: string;
  numericValue?: number | null;
  textValue?: string | null;
  choiceValue?: string | null;
  booleanValue?: boolean | null;
  technicianComment?: string | null;
};

export type SaveLabResultDraftInput = {
  items: SaveLabResultItemInput[];
  internalNote?: string | null;
  reportNote?: string | null;
};

async function auditLabResultEvent(input: {
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
    entityType: "LabResult",
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidateResultPaths(resultId?: string) {
  revalidatePath("/lab/result-entry");
  revalidatePath("/lab/lis-worklist");
  revalidatePath("/lab/corrections");
  revalidatePath("/lab/verification");
  if (resultId) {
    revalidatePath(`/lab/result-entry/${resultId}`);
    revalidatePath(`/lab/result-entry/${resultId}/edit`);
  }
}

function decimalOrNull(value: number | null | undefined): Prisma.Decimal | null {
  if (value == null) return null;
  return new Prisma.Decimal(value);
}

export async function searchResultEntryWorklistAction() {
  const session = await requireTenantPermission("/lab/result-entry");
  return listResultEntryWorklist(session.tenantId, session.branchId);
}

export async function getLabResultEntryAction(resultId: string) {
  const session = await requireTenantPermission("/lab/result-entry");
  return assertTenantOwnsLabResult(session.tenantId, resultId);
}

export async function createLabResultDraftAction(labOrderTestId: string): Promise<LabResultActionResult> {
  await requireTenantPermission("/lab/result-entry", "canEdit");
  const session = await requireTenantSession();

  const orderTest = await prisma.labOrderTest.findFirst({
    where: { id: labOrderTestId, tenantId: session.tenantId },
    include: {
      labOrder: {
        include: {
          patient: { select: { gender: true, dateOfBirth: true } },
        },
      },
      sampleTests: {
        include: {
          labSample: true,
        },
      },
      tenantService: true,
    },
  });

  if (!orderTest) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_ORDER_TEST_INVALID };
  }

  if (orderTest.status !== "READY_FOR_RESULT" && orderTest.status !== "RESULT_IN_PROGRESS") {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_SOURCE_NOT_READY };
  }

  const existing = await findActiveLabResultForOrderTest(session.tenantId, labOrderTestId);
  if (existing) {
    return { ok: true, resultId: existing.id, recordVersion: existing.recordVersion };
  }

  const sampleLink = orderTest.sampleTests.find(
    (row) =>
      row.labSample.sampleStatus === "READY_FOR_RESULT" ||
      row.labSample.sampleStatus === "IN_PROCESS" ||
      row.labSample.sampleStatus === "RECEIVED",
  );
  if (!sampleLink) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_SAMPLE_INVALID };
  }

  const sample = sampleLink.labSample;
  if (session.branchId && sample.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_BRANCH_ACCESS_DENIED };
  }

  const referenceDate = sample.collectedAt ?? sample.receivedAt ?? new Date();
  const patient = orderTest.labOrder.patient;
  const patientAgeDays = patient?.dateOfBirth
    ? calculateAgeInDays(patient.dateOfBirth, referenceDate)
    : null;

  const parameters = orderTest.tenantServiceId
    ? await prisma.serviceParameter.findMany({
        where: {
          tenantId: session.tenantId,
          tenantServiceId: orderTest.tenantServiceId,
          isActive: true,
        },
        include: {
          referenceRanges: { where: { isActive: true }, orderBy: { priority: "desc" } },
        },
        orderBy: { displayOrder: "asc" },
      })
    : [];

  if (!parameters.length) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_PARAMETER_NOT_FOUND };
  }

  const created = await prisma.$transaction(async (tx) => {
    const result = await tx.labResult.create({
      data: {
        tenantId: session.tenantId,
        branchId: sample.branchId,
        labOrderId: orderTest.labOrderId,
        labOrderTestId,
        labSampleId: sample.id,
        status: "DRAFT",
        referenceDate,
        patientAgeDays,
        enteredById: session.userId,
        enteredAt: new Date(),
        items: {
          create: parameters.map((parameter) => {
            const rangeSelection = selectReferenceRange(parameter.referenceRanges, {
              patientGender: patient?.gender ?? null,
              ageInDays: patientAgeDays ?? 0,
              parameterUnit: parameter.unit,
            });
            const range = rangeSelection.ok ? rangeSelection.range : null;
            return {
              tenantId: session.tenantId,
              serviceParameterId: parameter.id,
              parameterCode: parameter.parameterCode,
              parameterName: parameter.parameterName,
              resultType: parameter.resultType,
              decimalPlaces: parameter.decimalPlaces,
              isRequired: parameter.isRequired,
              unitSnapshot: parameter.unit,
              referenceRangeSnapshot: range?.snapshot ?? null,
              lowerBoundSnapshot: decimalOrNull(range?.lowerBound),
              upperBoundSnapshot: decimalOrNull(range?.upperBound),
              criticalLowSnapshot: decimalOrNull(range?.criticalLow),
              criticalHighSnapshot: decimalOrNull(range?.criticalHigh),
              selectedReferenceRangeId: range?.id ?? null,
              displayOrder: parameter.displayOrder,
            };
          }),
        },
      },
    });

    await tx.labOrderTest.update({
      where: { id: labOrderTestId },
      data: { status: "RESULT_IN_PROGRESS" },
    });

    return result;
  });

  await auditLabResultEvent({
    tenantId: session.tenantId,
    branchId: sample.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "LAB_RESULT_DRAFT_CREATED",
    entityId: created.id,
    changeData: { labOrderTestId },
  });

  revalidateResultPaths(created.id);
  return { ok: true, resultId: created.id, recordVersion: created.recordVersion };
}

async function applyItemUpdates(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    userId: string;
    resultId: string;
    items: SaveLabResultItemInput[];
  },
) {
  const dbItems = await tx.labResultItem.findMany({
    where: { labResultId: input.resultId, tenantId: input.tenantId },
  });
  const itemMap = new Map(dbItems.map((row) => [row.id, row]));

  for (const itemInput of input.items) {
    const dbItem = itemMap.get(itemInput.itemId);
    if (!dbItem) {
      throw new Error(LAB_RESULT_ERROR_CODES.LAB_RESULT_PARAMETER_NOT_FOUND);
    }

    const validation = validateResultValue({
      resultType: dbItem.resultType,
      numericValue: itemInput.numericValue,
      textValue: itemInput.textValue,
      choiceValue: itemInput.choiceValue,
      booleanValue: itemInput.booleanValue,
      decimalPlaces: dbItem.decimalPlaces,
      isRequired: dbItem.isRequired,
    });
    if (!validation.ok) {
      throw new Error(validation.errorCode);
    }

    const flagResult = computeAbnormalFlag({
      resultType: dbItem.resultType,
      numericValue: itemInput.numericValue ?? null,
      textValue: itemInput.textValue ?? null,
      choiceValue: itemInput.choiceValue ?? null,
      booleanValue: itemInput.booleanValue ?? null,
      lowerBound: dbItem.lowerBoundSnapshot ? Number(dbItem.lowerBoundSnapshot) : null,
      upperBound: dbItem.upperBoundSnapshot ? Number(dbItem.upperBoundSnapshot) : null,
      criticalLow: dbItem.criticalLowSnapshot ? Number(dbItem.criticalLowSnapshot) : null,
      criticalHigh: dbItem.criticalHighSnapshot ? Number(dbItem.criticalHighSnapshot) : null,
      unitSnapshot: dbItem.unitSnapshot,
      parameterUnit: dbItem.unitSnapshot,
      rangeUnit: dbItem.unitSnapshot,
    });

    await tx.labResultItem.update({
      where: { id: dbItem.id },
      data: {
        numericValue: decimalOrNull(itemInput.numericValue),
        textValue: itemInput.textValue?.trim() || null,
        choiceValue: itemInput.choiceValue?.trim() || null,
        booleanValue: itemInput.booleanValue ?? null,
        technicianComment: itemInput.technicianComment?.trim() || null,
        abnormalFlag: flagResult.flag,
        isCritical: flagResult.isCritical,
      },
    });

    if (flagResult.isCritical) {
      const existingEvent = await tx.labCriticalValueEvent.findFirst({
        where: { labResultItemId: dbItem.id, acknowledgedAt: null },
      });
      if (!existingEvent) {
        await tx.labCriticalValueEvent.create({
          data: {
            tenantId: input.tenantId,
            labResultId: input.resultId,
            labResultItemId: dbItem.id,
            detectedById: input.userId,
          },
        });
      }
    }
  }
}

export async function saveLabResultDraftAction(
  resultId: string,
  input: SaveLabResultDraftInput,
): Promise<LabResultActionResult> {
  await requireTenantPermission("/lab/result-entry/edit", "canEdit");
  const session = await requireTenantSession();
  const result = await assertTenantOwnsLabResult(session.tenantId, resultId);

  if (!isLabResultEditable(result.status) && !isLabResultCorrectable(result.status)) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_INVALID_STATUS };
  }

  if (session.branchId && result.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_BRANCH_ACCESS_DENIED };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await applyItemUpdates(tx, {
        tenantId: session.tenantId,
        userId: session.userId,
        resultId,
        items: input.items,
      });

      return tx.labResult.update({
        where: { id: resultId },
        data: {
          internalNote: input.internalNote?.trim() || null,
          reportNote: input.reportNote?.trim() || null,
          status: result.status === "DRAFT" ? "IN_PROGRESS" : result.status,
          enteredById: session.userId,
          enteredAt: new Date(),
          recordVersion: { increment: 1 },
        },
      });
    });

    await auditLabResultEvent({
      tenantId: session.tenantId,
      branchId: result.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: "UPDATE",
      event: "LAB_RESULT_DRAFT_SAVED",
      entityId: resultId,
    });

    revalidateResultPaths(resultId);
    return { ok: true, resultId, recordVersion: updated.recordVersion };
  } catch (error) {
    const message = error instanceof Error ? error.message : LAB_RESULT_ERROR_CODES.LAB_RESULT_VALIDATION;
    return { ok: false, errorCode: message };
  }
}

export async function completeLabResultEntryAction(
  resultId: string,
  recordVersion: number,
): Promise<LabResultActionResult> {
  await requireTenantPermission("/lab/result-entry/complete", "canEdit");
  const session = await requireTenantSession();
  const result = await assertTenantOwnsLabResult(session.tenantId, resultId);

  if (result.recordVersion !== recordVersion) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_VERSION_CONFLICT };
  }

  if (!isLabResultEditable(result.status) && !isLabResultCorrectable(result.status)) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_INVALID_STATUS };
  }

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
    if (!validation.ok) {
      return { ok: false, errorCode: validation.errorCode };
    }
  }

  const unacknowledgedCritical = result.criticalEvents.filter((event) => !event.acknowledgedAt);
  if (unacknowledgedCritical.length > 0) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_CRITICAL_VALUE };
  }

  const nextStatus: LabResultStatus = "READY_FOR_VERIFICATION";
  if (!canTransitionLabResultStatus(result.status, "ENTRY_COMPLETED")) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_INVALID_STATUS };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.labResult.update({
      where: { id: resultId },
      data: {
        status: nextStatus,
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

  await auditLabResultEvent({
    tenantId: session.tenantId,
    branchId: result.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_RESULT_ENTRY_COMPLETED",
    entityId: resultId,
  });

  revalidateResultPaths(resultId);
  return { ok: true, resultId, recordVersion: updated.recordVersion };
}

export async function reopenLabResultEntryAction(
  resultId: string,
  reason: string,
  recordVersion: number,
): Promise<LabResultActionResult> {
  await requireTenantPermission("/lab/result-entry/reopen", "canEdit");
  const session = await requireTenantSession();
  const result = await assertTenantOwnsLabResult(session.tenantId, resultId);

  if (result.recordVersion !== recordVersion) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_VERSION_CONFLICT };
  }

  if (!reason.trim()) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_REOPEN_REASON_REQUIRED };
  }

  if (!canReopenLabResult(result.status)) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_INVALID_STATUS };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.labResult.update({
      where: { id: resultId },
      data: {
        status: "IN_PROGRESS",
        reopenReason: reason.trim(),
        reopenedAt: new Date(),
        reopenedById: session.userId,
        recordVersion: { increment: 1 },
      },
    });

    await tx.labOrderTest.update({
      where: { id: result.labOrderTestId },
      data: { status: "RESULT_IN_PROGRESS" },
    });

    return saved;
  });

  await auditLabResultEvent({
    tenantId: session.tenantId,
    branchId: result.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_RESULT_REOPENED",
    entityId: resultId,
    changeData: { reason: reason.trim() },
  });

  revalidateResultPaths(resultId);
  return { ok: true, resultId, recordVersion: updated.recordVersion };
}

export async function cancelLabResultAction(resultId: string, reason: string): Promise<LabResultActionResult> {
  await requireTenantPermission("/lab/result-entry", "canEdit");
  const session = await requireTenantSession();
  const result = await assertTenantOwnsLabResult(session.tenantId, resultId);

  if (result.status === "VERIFIED" || result.status === "CANCELLED") {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_INVALID_STATUS };
  }

  if (!reason.trim()) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_REOPEN_REASON_REQUIRED };
  }

  await prisma.$transaction(async (tx) => {
    await tx.labResult.update({
      where: { id: resultId },
      data: {
        status: "CANCELLED",
        reopenReason: reason.trim(),
        recordVersion: { increment: 1 },
      },
    });

    await tx.labOrderTest.update({
      where: { id: result.labOrderTestId },
      data: { status: "READY_FOR_RESULT" },
    });
  });

  await auditLabResultEvent({
    tenantId: session.tenantId,
    branchId: result.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_RESULT_CANCELLED",
    entityId: resultId,
    changeData: { reason: reason.trim() },
  });

  revalidateResultPaths(resultId);
  return { ok: true, resultId };
}

export async function acknowledgeCriticalValueAction(
  eventId: string,
  note?: string,
): Promise<LabResultActionResult> {
  await requireTenantPermission("/lab/result-entry/critical-acknowledge", "canEdit");
  const session = await requireTenantSession();

  const event = await prisma.labCriticalValueEvent.findFirst({
    where: { id: eventId, tenantId: session.tenantId },
    include: { labResult: { select: { id: true, branchId: true } } },
  });

  if (!event) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_NOT_FOUND };
  }

  if (event.acknowledgedAt) {
    return { ok: true, resultId: event.labResultId };
  }

  await prisma.labCriticalValueEvent.update({
    where: { id: eventId },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedById: session.userId,
      communicationNote: note?.trim() || null,
    },
  });

  await auditLabResultEvent({
    tenantId: session.tenantId,
    branchId: event.labResult.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_RESULT_CRITICAL_ACKNOWLEDGED",
    entityId: event.labResultId,
    changeData: { eventId },
  });

  revalidateResultPaths(event.labResultId);
  return { ok: true, resultId: event.labResultId };
}

export type LabResultEntryData = NonNullable<Awaited<ReturnType<typeof getLabResultEntryAction>>>;
