"use server";

import { revalidatePath } from "next/cache";
import type { AnalyzerImportChannel } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { isReconcilable, isTerminalImportStatus } from "@/lib/laboratory-lis/constants";
import { LAB_LIS_ERROR_CODES } from "@/lib/laboratory-lis/errors";
import { ingestAnalyzerMessage, processQueuedMessage } from "@/lib/laboratory-lis/ingest";
import { parseAnalyzerMessage } from "@/lib/laboratory-lis/parse";
import {
  assertTenantOwnsImportMessage,
  listAnalyzerMappings,
  listImportQueue,
} from "@/lib/laboratory-lis/queries";

export type LabLisActionResult =
  | { ok: true; queueId?: string; labResultId?: string; appliedCount?: number; status?: string }
  | { ok: false; errorCode: string; errorMessage?: string };

async function auditLisEvent(input: {
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
    entityType: "AnalyzerImportQueue",
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidateLisPaths(resultId?: string) {
  revalidatePath("/lab/lis-worklist");
  revalidatePath("/lab/result-entry");
  revalidatePath("/settings/analyzers");
  if (resultId) revalidatePath(`/lab/result-entry/${resultId}`);
}

export async function listImportQueueAction() {
  const session = await requireTenantPermission("/lab/lis-worklist");
  return listImportQueue(session.tenantId, session.branchId);
}

export async function getImportMessageAction(queueId: string) {
  const session = await requireTenantPermission("/lab/lis-worklist");
  return assertTenantOwnsImportMessage(session.tenantId, queueId);
}

export async function listAnalyzerMappingsAction(analyzerId?: string) {
  const session = await requireTenantPermission("/settings/analyzers");
  return listAnalyzerMappings(session.tenantId, analyzerId);
}

/**
 * Receives one analyzer/LIS message. The raw payload is always archived first so a rejected
 * or quarantined message stays auditable, and nothing is ever matched by patient name.
 */
export async function ingestAnalyzerMessageAction(input: {
  channel: AnalyzerImportChannel;
  rawPayload: string;
}): Promise<LabLisActionResult> {
  await requireTenantPermission("/lab/lis-worklist/import", "canEdit");
  const session = await requireTenantSession();

  if (!session.branchId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_BRANCH_ACCESS_DENIED };
  }

  const outcome = await ingestAnalyzerMessage({
    tenantId: session.tenantId,
    branchId: session.branchId,
    userId: session.userId,
    channel: input.channel,
    rawPayload: input.rawPayload,
  });

  if (outcome.queueId) {
    await auditLisEvent({
      tenantId: session.tenantId,
      branchId: session.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: outcome.status === "DUPLICATE" ? "UPDATE" : "INSERT",
      event: `LAB_LIS_MESSAGE_${outcome.status}`,
      entityId: outcome.queueId,
      changeData: outcome.ok
        ? { labResultId: outcome.labResultId, appliedCount: outcome.appliedCount }
        : { errorCode: outcome.errorCode, errorMessage: outcome.errorMessage },
    });
  }

  revalidateLisPaths(outcome.ok ? outcome.labResultId : undefined);

  if (!outcome.ok) {
    return {
      ok: false,
      errorCode: outcome.status === "DUPLICATE" ? "DUPLICATE_MESSAGE" : outcome.errorCode,
      errorMessage: outcome.errorMessage,
    };
  }

  return {
    ok: true,
    queueId: outcome.queueId,
    labResultId: outcome.labResultId,
    appliedCount: outcome.appliedCount,
    status: outcome.status,
  };
}

/**
 * Authorized reconciliation of a quarantined message: the operator supplies the corrected
 * sample identifier and/or machine test code mapping, and the archived raw payload is replayed.
 */
export async function reconcileImportMessageAction(input: {
  queueId: string;
  machineSampleId?: string;
  machineTestCodeMap?: Record<string, string>;
  resolutionNote: string;
}): Promise<LabLisActionResult> {
  await requireTenantPermission("/lab/lis-worklist/reconcile", "canApprove");
  const session = await requireTenantSession();

  const note = input.resolutionNote?.trim();
  if (!note) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_RECONCILE_INPUT_REQUIRED };
  }

  const queue = await assertTenantOwnsImportMessage(session.tenantId, input.queueId);

  if (session.branchId && queue.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_BRANCH_ACCESS_DENIED };
  }
  if (isTerminalImportStatus(queue.processedStatus)) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_ALREADY_PROCESSED };
  }
  if (!isReconcilable(queue.processedStatus)) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_NOT_QUARANTINED };
  }

  const parsed = parseAnalyzerMessage(queue.importChannel, queue.rawPayload);
  if (!parsed.ok) {
    return { ok: false, errorCode: parsed.errorCode };
  }

  const outcome = await processQueuedMessage({
    tenantId: session.tenantId,
    branchId: queue.branchId,
    userId: session.userId,
    queueId: queue.id,
    analyzerId: queue.analyzerId,
    parsed: parsed.message,
    overrides: {
      machineSampleId: input.machineSampleId,
      machineTestCodeMap: input.machineTestCodeMap,
    },
    successStatus: "RECONCILED",
  });

  if (outcome.ok) {
    await prisma.analyzerErrorQueue.updateMany({
      where: { tenantId: session.tenantId, queueId: queue.id, resolvedAt: null },
      data: {
        resolvedAt: new Date(),
        resolvedById: session.userId,
        resolutionNote: note,
      },
    });
  }

  await auditLisEvent({
    tenantId: session.tenantId,
    branchId: queue.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: outcome.ok ? "LAB_LIS_MESSAGE_RECONCILED" : "LAB_LIS_RECONCILE_FAILED",
    entityId: queue.id,
    changeData: outcome.ok
      ? { labResultId: outcome.labResultId, appliedCount: outcome.appliedCount, resolutionNote: note }
      : { errorCode: outcome.errorCode, errorMessage: outcome.errorMessage, resolutionNote: note },
  });

  revalidateLisPaths(outcome.ok ? outcome.labResultId : undefined);

  if (!outcome.ok) {
    return { ok: false, errorCode: outcome.errorCode, errorMessage: outcome.errorMessage };
  }
  return {
    ok: true,
    queueId: outcome.queueId,
    labResultId: outcome.labResultId,
    appliedCount: outcome.appliedCount,
    status: outcome.status,
  };
}

export async function createAnalyzerMappingAction(input: {
  analyzerId: string;
  machineTestCode: string;
  tenantServiceId: string;
  parameterCode?: string | null;
}): Promise<LabLisActionResult> {
  await requireTenantPermission("/settings/analyzers/mapping", "canEdit");
  const session = await requireTenantSession();

  const machineTestCode = input.machineTestCode?.trim();
  if (!machineTestCode) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_RECONCILE_INPUT_REQUIRED };
  }

  const analyzer = await prisma.analyzer.findFirst({
    where: { id: input.analyzerId, tenantId: session.tenantId },
    select: { id: true, branchId: true },
  });
  if (!analyzer) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_ANALYZER_INVALID };
  }
  if (session.branchId && analyzer.branchId !== session.branchId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_BRANCH_ACCESS_DENIED };
  }

  const service = await prisma.tenantService.findFirst({
    where: { id: input.tenantServiceId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!service) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MAPPING_SERVICE_INVALID };
  }

  const parameterCode = input.parameterCode?.trim() || null;
  const duplicate = await prisma.analyzerMapping.findFirst({
    where: {
      tenantId: session.tenantId,
      analyzerId: analyzer.id,
      machineTestCode,
      parameterCode,
    },
    select: { id: true },
  });
  if (duplicate) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MAPPING_EXISTS };
  }

  const mapping = await prisma.analyzerMapping.create({
    data: {
      tenantId: session.tenantId,
      analyzerId: analyzer.id,
      machineTestCode,
      tenantServiceId: service.id,
      parameterCode,
      createdById: session.userId,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    branchId: analyzer.branchId,
    userId: session.userId,
    actionType: "INSERT",
    entityType: "AnalyzerMapping",
    entityId: mapping.id,
    changeData: {
      event: "LAB_LIS_MAPPING_CREATED",
      machineTestCode,
      tenantServiceId: service.id,
      parameterCode,
    },
    createdBy: session.user.name,
  });

  revalidateLisPaths();
  return { ok: true, queueId: mapping.id };
}
