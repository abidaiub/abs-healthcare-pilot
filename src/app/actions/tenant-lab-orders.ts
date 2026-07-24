"use server";

import { revalidatePath } from "next/cache";
import type { LabOrderPriority, LabOrderSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { canCancelLabOrder, canTransitionLabOrderStatus, isLabOrderEditable } from "@/lib/laboratory/constants";
import { LAB_ERROR_CODES } from "@/lib/laboratory/errors";
import { groupTestsBySpecimen } from "@/lib/laboratory/grouping";
import { allocateAccessionNumber, allocateLabOrderNumber } from "@/lib/laboratory/number";
import {
  assertTenantOwnsLabOrder,
  assertTenantOwnsLabSample,
  findDraftLabOrderForEncounter,
  findDraftLabOrderForPrescription,
  labOrderInclude,
  listLabOrders,
  syncLabOrderStatusFromTests,
} from "@/lib/laboratory/queries";

export type LabOrderActionResult =
  | { ok: true; labOrderId?: string; orderNumber?: string; sampleId?: string; accessionNumber?: string }
  | { ok: false; errorCode: string };

type LabOrderLineCreateInput = {
  tenantServiceId?: string;
  sourceEncounterInvestigationId?: string;
  sourcePrescriptionInvestigationId?: string;
  testCode?: string;
  testName: string;
  departmentId?: string | null;
  sampleTypeId?: string | null;
  sampleContainerId?: string | null;
  specimenRequirementSnapshot?: string | null;
  instructions?: string | null;
  priority?: LabOrderPriority;
};

async function auditLabEvent(input: {
  tenantId: string;
  branchId?: string;
  userId: string;
  actorName: string;
  actionType: "INSERT" | "UPDATE" | "PRINT";
  event: string;
  entityType: string;
  entityId: string;
  changeData?: Record<string, unknown>;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    branchId: input.branchId,
    userId: input.userId,
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidateLabPaths(orderId?: string, sampleId?: string) {
  revalidatePath("/lab/orders");
  revalidatePath("/lab/collection");
  revalidatePath("/lab/receipt");
  revalidatePath("/lab/processing");
  if (orderId) {
    revalidatePath(`/lab/orders/${orderId}`);
    revalidatePath(`/lab/orders/${orderId}/edit`);
    revalidatePath(`/lab/orders/${orderId}/collect`);
  }
  if (sampleId) {
    revalidatePath(`/lab/samples/${sampleId}`);
    revalidatePath(`/lab/samples/${sampleId}/label`);
  }
}

async function buildTestLineFromTenantService(tenantId: string, tenantServiceId: string) {
  const service = await prisma.tenantService.findFirst({
    where: { id: tenantServiceId, tenantId, isActive: true },
    include: { sampleType: true, sampleContainer: true, department: true, hostService: true },
  });
  if (!service) return null;
  const testCode = service.hostService?.serviceCode ?? service.id.slice(-8).toUpperCase();
  const snapshot = [service.sampleType?.sampleType, service.sampleContainer?.containerType]
    .filter(Boolean)
    .join(" / ");
  return {
    tenantServiceId: service.id,
    testCode,
    testName: service.localName,
    departmentId: service.departmentId,
    sampleTypeId: service.sampleTypeId,
    sampleContainerId: service.sampleContainerId,
    specimenRequirementSnapshot: snapshot || null,
  };
}

async function buildTestLineFromEncounterAdvice(tenantId: string, adviceId: string) {
  const advice = await prisma.encounterInvestigationAdvice.findFirst({
    where: { id: adviceId, tenantId, isActive: true, status: { not: "CANCELLED" } },
  });
  if (!advice) return null;
  const existing = await prisma.labOrderTest.findFirst({
    where: {
      tenantId,
      sourceEncounterInvestigationId: adviceId,
      labOrder: { status: { notIn: ["CANCELLED"] } },
    },
  });
  if (existing) return { duplicate: true as const };
  return {
    sourceEncounterInvestigationId: advice.id,
    testName: advice.investigationText,
    instructions: advice.instructions,
    priority: (advice.priority?.toUpperCase() === "STAT"
      ? "STAT"
      : advice.priority?.toUpperCase() === "URGENT"
        ? "URGENT"
        : "ROUTINE") as LabOrderPriority,
  };
}

export async function listLabOrdersAction() {
  const session = await requireTenantPermission("/lab/orders");
  return listLabOrders(session.tenantId, session.branchId);
}

export async function findEncounterLabOrderDraftAction(encounterId: string) {
  const session = await requireTenantPermission("/lab/orders");
  const order = await findDraftLabOrderForEncounter(session.tenantId, encounterId);
  return order ? { id: order.id, status: order.status, orderNumber: order.orderNumber } : null;
}

export async function findPrescriptionLabOrderDraftAction(prescriptionId: string) {
  const session = await requireTenantPermission("/lab/orders");
  const order = await findDraftLabOrderForPrescription(session.tenantId, prescriptionId);
  return order ? { id: order.id, status: order.status, orderNumber: order.orderNumber } : null;
}

export async function getLabOrderByIdAction(orderId: string) {
  const session = await requireTenantPermission("/lab/orders");
  return assertTenantOwnsLabOrder(session.tenantId, orderId);
}

export async function getLabSampleByIdAction(sampleId: string) {
  const session = await requireTenantPermission("/lab/orders");
  return assertTenantOwnsLabSample(session.tenantId, sampleId);
}

export async function createLabOrderFromEncounterAction(
  encounterId: string,
  investigationIds: string[],
): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/orders/new", "canCreate");
  const session = await requireTenantSession();

  const encounter = await prisma.clinicalEncounter.findFirst({
    where: { id: encounterId, tenantId: session.tenantId },
    include: { patient: true, doctor: true },
  });
  if (!encounter || encounter.status === "CANCELLED") {
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_SOURCE_INVALID };
  }

  const existingDraft = await findDraftLabOrderForEncounter(session.tenantId, encounterId);
  if (existingDraft) return { ok: true, labOrderId: existingDraft.id, orderNumber: existingDraft.orderNumber };

  const lines: LabOrderLineCreateInput[] = [];
  for (const id of investigationIds) {
    const line = await buildTestLineFromEncounterAdvice(session.tenantId, id);
    if (!line || "duplicate" in line) {
      if (line && "duplicate" in line) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_DUPLICATE_SOURCE };
      continue;
    }
    lines.push(line);
  }
  if (!lines.length) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_EMPTY };

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.labOrder.create({
      data: {
        tenantId: session.tenantId,
        branchId: encounter.branchId,
        patientId: encounter.patientId,
        doctorId: encounter.doctorId,
        encounterId: encounter.id,
        appointmentId: encounter.appointmentId,
        orderNumber: await allocateLabOrderNumber(tx, session.tenantId),
        orderSource: "ENCOUNTER_ADVICE",
        clinicalNote: encounter.clinicalNotes,
        createdById: session.userId,
        updatedById: session.userId,
        tests: {
          create: lines.map((line, index) => ({
            tenantId: session.tenantId,
            ...line,
            status: "ORDERED",
            sequence: index,
          })),
        },
      },
    });
    return created;
  });

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: order.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "LAB_ORDER_CREATED_FROM_ENCOUNTER",
    entityType: "LabOrder",
    entityId: order.id,
  });

  revalidateLabPaths(order.id);
  return { ok: true, labOrderId: order.id, orderNumber: order.orderNumber };
}

function mapInvestigationPriority(priority: string | null | undefined): LabOrderPriority {
  const normalized = priority?.toUpperCase();
  if (normalized === "STAT") return "STAT";
  if (normalized === "URGENT") return "URGENT";
  return "ROUTINE";
}

async function buildTestLineFromPrescriptionInvestigation(tenantId: string, investigationId: string) {
  const investigation = await prisma.prescriptionInvestigation.findFirst({
    where: { id: investigationId, tenantId, isActive: true },
  });
  if (!investigation) return null;
  const existing = await prisma.labOrderTest.findFirst({
    where: {
      tenantId,
      sourcePrescriptionInvestigationId: investigationId,
      labOrder: { status: { notIn: ["CANCELLED"] } },
    },
  });
  if (existing) return { duplicate: true as const };
  return {
    sourcePrescriptionInvestigationId: investigation.id,
    testName: investigation.investigationText,
    instructions: investigation.instructions,
    priority: mapInvestigationPriority(investigation.priority),
  };
}

export async function createLabOrderFromPrescriptionAction(
  prescriptionId: string,
  investigationIds: string[],
): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/orders/new", "canCreate");
  const session = await requireTenantSession();

  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, tenantId: session.tenantId },
    include: { patient: true, doctor: true },
  });
  if (!prescription || prescription.status === "CANCELLED") {
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_SOURCE_INVALID };
  }

  const existingDraft = await findDraftLabOrderForPrescription(session.tenantId, prescriptionId);
  if (existingDraft) {
    return { ok: true, labOrderId: existingDraft.id, orderNumber: existingDraft.orderNumber };
  }

  const lines: LabOrderLineCreateInput[] = [];
  for (const id of investigationIds) {
    const line = await buildTestLineFromPrescriptionInvestigation(session.tenantId, id);
    if (!line || "duplicate" in line) {
      if (line && "duplicate" in line) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_DUPLICATE_SOURCE };
      continue;
    }
    lines.push(line);
  }
  if (!lines.length) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_EMPTY };

  const order = await prisma.$transaction(async (tx) => {
    return tx.labOrder.create({
      data: {
        tenantId: session.tenantId,
        branchId: prescription.branchId,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        encounterId: prescription.encounterId,
        appointmentId: prescription.appointmentId,
        prescriptionId: prescription.id,
        orderNumber: await allocateLabOrderNumber(tx, session.tenantId),
        orderSource: "PRESCRIPTION",
        clinicalNote: prescription.clinicalSummary,
        createdById: session.userId,
        updatedById: session.userId,
        tests: {
          create: lines.map((line, index) => ({
            tenantId: session.tenantId,
            ...line,
            status: "ORDERED",
            sequence: index,
          })),
        },
      },
    });
  });

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: order.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "LAB_ORDER_CREATED_FROM_PRESCRIPTION",
    entityType: "LabOrder",
    entityId: order.id,
  });

  revalidateLabPaths(order.id);
  return { ok: true, labOrderId: order.id, orderNumber: order.orderNumber };
}

export async function updateLabOrderDraftAction(
  orderId: string,
  input: {
    tenantServiceIds?: string[];
    priority?: LabOrderPriority;
    clinicalNote?: string;
  },
): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/orders/edit", "canEdit");
  const session = await requireTenantSession();
  const order = await assertTenantOwnsLabOrder(session.tenantId, orderId);
  if (!isLabOrderEditable(order.status)) {
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_INVALID_STATUS };
  }

  await prisma.$transaction(async (tx) => {
    if (input.tenantServiceIds?.length) {
      await tx.labOrderTest.deleteMany({ where: { labOrderId: orderId, tenantId: session.tenantId } });
      const lines: LabOrderLineCreateInput[] = [];
      for (const serviceId of input.tenantServiceIds) {
        const line = await buildTestLineFromTenantService(session.tenantId, serviceId);
        if (line) lines.push(line);
      }
      if (!lines.length) throw new Error(LAB_ERROR_CODES.LAB_ORDER_EMPTY);
      await tx.labOrderTest.createMany({
        data: lines.map((line, index) => ({
          tenantId: session.tenantId,
          labOrderId: orderId,
          ...line,
          status: "ORDERED",
          sequence: index,
        })),
      });
    }

    await tx.labOrder.update({
      where: { id: orderId },
      data: {
        priority: input.priority ?? order.priority,
        clinicalNote: input.clinicalNote?.trim() ?? order.clinicalNote,
        updatedById: session.userId,
      },
    });
  });

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: order.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_ORDER_DRAFT_UPDATED",
    entityType: "LabOrder",
    entityId: orderId,
  });

  revalidateLabPaths(orderId);
  return { ok: true, labOrderId: orderId, orderNumber: order.orderNumber };
}

export async function confirmLabOrderAction(orderId: string): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/orders/confirm", "canEdit");
  const session = await requireTenantSession();
  const order = await assertTenantOwnsLabOrder(session.tenantId, orderId);

  if (!isLabOrderEditable(order.status)) {
    if (order.status === "CONFIRMED") return { ok: true, labOrderId: order.id, orderNumber: order.orderNumber };
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_INVALID_STATUS };
  }
  if (!order.tests.length) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_EMPTY };

  await prisma.$transaction(async (tx) => {
    await tx.labOrder.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        updatedById: session.userId,
      },
    });
    await tx.labOrderTest.updateMany({
      where: { labOrderId: orderId, tenantId: session.tenantId },
      data: { status: "SAMPLE_PENDING" },
    });

    const groups = groupTestsBySpecimen(
      await tx.labOrderTest.findMany({ where: { labOrderId: orderId, tenantId: session.tenantId } }),
    );
    for (const group of groups) {
      const first = group.tests[0];
      const accession = await allocateAccessionNumber(tx, session.tenantId);
      const sample = await tx.labSample.create({
        data: {
          tenantId: session.tenantId,
          branchId: order.branchId,
          labOrderId: orderId,
          sampleTypeId: first.sampleTypeId,
          sampleContainerId: first.sampleContainerId,
          accessionNumber: accession,
          barcodeValue: accession,
          sampleStatus: "PENDING_COLLECTION",
        },
      });
      await tx.labSampleTest.createMany({
        data: group.tests.map((test) => ({
          tenantId: session.tenantId,
          labSampleId: sample.id,
          labOrderTestId: test.id,
        })),
      });
    }
  });

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: order.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_ORDER_CONFIRMED",
    entityType: "LabOrder",
    entityId: orderId,
  });

  revalidateLabPaths(orderId);
  return { ok: true, labOrderId: orderId, orderNumber: order.orderNumber };
}

export async function cancelLabOrderAction(orderId: string, reason: string): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/orders/cancel", "canEdit");
  const session = await requireTenantSession();
  const order = await assertTenantOwnsLabOrder(session.tenantId, orderId);
  if (!canCancelLabOrder(order.status)) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_INVALID_STATUS };
  if (!reason.trim()) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_VALIDATION };

  await prisma.labOrder.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason.trim(),
      updatedById: session.userId,
    },
  });

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: order.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "LAB_ORDER_CANCELLED",
    entityType: "LabOrder",
    entityId: orderId,
    changeData: { reason: reason.trim() },
  });

  revalidateLabPaths(orderId);
  return { ok: true, labOrderId: orderId };
}

export async function collectLabSampleAction(sampleId: string): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/orders/collect", "canEdit");
  const session = await requireTenantSession();
  const sample = await assertTenantOwnsLabSample(session.tenantId, sampleId);
  if (sample.sampleStatus !== "PENDING_COLLECTION") {
    if (sample.sampleStatus === "COLLECTED") return { ok: true, sampleId, accessionNumber: sample.accessionNumber };
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_SAMPLE_INVALID_STATUS };
  }

  await prisma.$transaction(async (tx) => {
    await tx.labSample.update({
      where: { id: sampleId },
      data: {
        sampleStatus: "COLLECTED",
        collectedAt: new Date(),
        collectedById: session.userId,
      },
    });
    const testIds = sample.sampleTests.map((row) => row.labOrderTestId);
    await tx.labOrderTest.updateMany({
      where: { id: { in: testIds }, tenantId: session.tenantId },
      data: { status: "SAMPLE_COLLECTED" },
    });
  });

  await syncLabOrderStatusFromTests(sample.labOrderId, session.tenantId);

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: sample.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "SAMPLE_COLLECTED",
    entityType: "LabSample",
    entityId: sampleId,
  });

  revalidateLabPaths(sample.labOrderId, sampleId);
  return { ok: true, sampleId, accessionNumber: sample.accessionNumber, labOrderId: sample.labOrderId };
}

export async function receiveLabSampleAction(sampleId: string, note?: string): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/receipt", "canEdit");
  const session = await requireTenantSession();
  const sample = await assertTenantOwnsLabSample(session.tenantId, sampleId);
  if (sample.sampleStatus !== "COLLECTED") {
    if (sample.sampleStatus === "RECEIVED") return { ok: true, sampleId, accessionNumber: sample.accessionNumber };
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_SAMPLE_INVALID_STATUS };
  }

  await prisma.$transaction(async (tx) => {
    await tx.labSample.update({
      where: { id: sampleId },
      data: {
        sampleStatus: "RECEIVED",
        receivedAt: new Date(),
        receivedById: session.userId,
        receiptOutcome: "ACCEPTED",
        receiptNote: note?.trim() || null,
      },
    });
    const testIds = sample.sampleTests.map((row) => row.labOrderTestId);
    await tx.labOrderTest.updateMany({
      where: { id: { in: testIds }, tenantId: session.tenantId },
      data: { status: "SAMPLE_RECEIVED" },
    });
  });

  await syncLabOrderStatusFromTests(sample.labOrderId, session.tenantId);

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: sample.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "SAMPLE_RECEIVED",
    entityType: "LabSample",
    entityId: sampleId,
  });

  revalidateLabPaths(sample.labOrderId, sampleId);
  return { ok: true, sampleId, accessionNumber: sample.accessionNumber };
}

export async function rejectLabSampleAction(
  sampleId: string,
  rejectionReasonId: string,
  note?: string,
): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/receipt", "canEdit");
  const session = await requireTenantSession();
  const sample = await assertTenantOwnsLabSample(session.tenantId, sampleId);
  if (sample.sampleStatus !== "COLLECTED" && sample.sampleStatus !== "RECEIVED") {
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_SAMPLE_INVALID_STATUS };
  }
  if (!rejectionReasonId) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_SAMPLE_REJECTION_REASON_REQUIRED };

  await prisma.$transaction(async (tx) => {
    await tx.labSample.update({
      where: { id: sampleId },
      data: {
        sampleStatus: "REJECTED",
        rejectedAt: new Date(),
        rejectedById: session.userId,
        rejectionReasonId,
        rejectionNote: note?.trim() || null,
        receiptOutcome: "REJECTED",
        recollectionRequired: true,
      },
    });
    const testIds = sample.sampleTests.map((row) => row.labOrderTestId);
    await tx.labOrderTest.updateMany({
      where: { id: { in: testIds }, tenantId: session.tenantId },
      data: { status: "RECOLLECTION_REQUIRED" },
    });
  });

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: sample.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "SAMPLE_REJECTED",
    entityType: "LabSample",
    entityId: sampleId,
  });

  revalidateLabPaths(sample.labOrderId, sampleId);
  return { ok: true, sampleId };
}

export async function requestSampleRecollectionAction(sampleId: string): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/collection", "canEdit");
  const session = await requireTenantSession();
  const sample = await assertTenantOwnsLabSample(session.tenantId, sampleId);
  if (sample.sampleStatus !== "REJECTED" || !sample.recollectionRequired) {
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_SAMPLE_INVALID_STATUS };
  }

  const pendingRecollection = await prisma.labSample.findFirst({
    where: {
      tenantId: session.tenantId,
      supersedesSampleId: sampleId,
      sampleStatus: "PENDING_COLLECTION",
    },
  });
  if (pendingRecollection) {
    return {
      ok: true,
      sampleId: pendingRecollection.id,
      accessionNumber: pendingRecollection.accessionNumber,
      labOrderId: sample.labOrderId,
    };
  }

  const created = await prisma.$transaction(async (tx) => {
    const nextAccession = await allocateAccessionNumber(tx, session.tenantId);
    const replacement = await tx.labSample.create({
      data: {
        tenantId: session.tenantId,
        branchId: sample.branchId,
        labOrderId: sample.labOrderId,
        sampleTypeId: sample.sampleTypeId,
        sampleContainerId: sample.sampleContainerId,
        accessionNumber: nextAccession,
        barcodeValue: nextAccession,
        sampleStatus: "PENDING_COLLECTION",
        supersedesSampleId: sample.id,
      },
    });
    const testIds = sample.sampleTests.map((row) => row.labOrderTestId);
    await tx.labSampleTest.createMany({
      data: testIds.map((labOrderTestId) => ({
        tenantId: session.tenantId,
        labSampleId: replacement.id,
        labOrderTestId,
      })),
    });
    await tx.labOrderTest.updateMany({
      where: { id: { in: testIds }, tenantId: session.tenantId },
      data: { status: "SAMPLE_PENDING" },
    });
    return { replacement, nextAccession };
  });

  await syncLabOrderStatusFromTests(sample.labOrderId, session.tenantId);

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: sample.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "SAMPLE_RECOLLECTION_REQUESTED",
    entityType: "LabSample",
    entityId: created.replacement.id,
    changeData: { supersedesSampleId: sampleId },
  });

  revalidateLabPaths(sample.labOrderId, created.replacement.id);
  return {
    ok: true,
    sampleId: created.replacement.id,
    accessionNumber: created.nextAccession,
    labOrderId: sample.labOrderId,
  };
}

export async function markSampleReadyForResultAction(sampleId: string): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/processing", "canEdit");
  const session = await requireTenantSession();
  const sample = await assertTenantOwnsLabSample(session.tenantId, sampleId);
  if (sample.sampleStatus !== "RECEIVED" && sample.sampleStatus !== "IN_PROCESS") {
    return { ok: false, errorCode: LAB_ERROR_CODES.LAB_SAMPLE_INVALID_STATUS };
  }

  await prisma.$transaction(async (tx) => {
    await tx.labSample.update({
      where: { id: sampleId },
      data: { sampleStatus: "READY_FOR_RESULT" },
    });
    const testIds = sample.sampleTests.map((row) => row.labOrderTestId);
    await tx.labOrderTest.updateMany({
      where: { id: { in: testIds }, tenantId: session.tenantId },
      data: { status: "READY_FOR_RESULT" },
    });
  });

  await syncLabOrderStatusFromTests(sample.labOrderId, session.tenantId);

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: sample.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "SAMPLE_READY_FOR_RESULT",
    entityType: "LabSample",
    entityId: sampleId,
  });

  revalidateLabPaths(sample.labOrderId, sampleId);
  return { ok: true, sampleId };
}

export async function printSampleLabelAction(sampleId: string, reprint = false): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/samples/label", "canPrint");
  const session = await requireTenantSession();
  const sample = await assertTenantOwnsLabSample(session.tenantId, sampleId);

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: sample.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "PRINT",
    event: reprint ? "SAMPLE_LABEL_REPRINTED" : "SAMPLE_LABEL_PRINTED",
    entityType: "LabSample",
    entityId: sampleId,
  });

  return { ok: true, sampleId, accessionNumber: sample.accessionNumber };
}

export async function listCollectionWorklistAction() {
  const session = await requireTenantPermission("/lab/collection");
  return prisma.labOrder.findMany({
    where: {
      tenantId: session.tenantId,
      branchId: session.branchId,
      status: { in: ["CONFIRMED", "PARTIALLY_COLLECTED"] },
    },
    include: labOrderInclude,
    orderBy: { orderedAt: "asc" },
    take: 100,
  });
}

export async function listReceiptWorklistAction() {
  const session = await requireTenantPermission("/lab/receipt");
  return prisma.labSample.findMany({
    where: {
      tenantId: session.tenantId,
      branchId: session.branchId,
      sampleStatus: "COLLECTED",
    },
    include: {
      labOrder: { include: { patient: true } },
      sampleType: true,
    },
    orderBy: { collectedAt: "asc" },
    take: 100,
  });
}

export async function listProcessingWorklistAction() {
  const session = await requireTenantPermission("/lab/processing");
  return prisma.labSample.findMany({
    where: {
      tenantId: session.tenantId,
      branchId: session.branchId,
      sampleStatus: { in: ["RECEIVED", "IN_PROCESS"] },
    },
    include: {
      labOrder: { include: { patient: true } },
      sampleTests: { include: { labOrderTest: { include: { department: true } } } },
    },
    orderBy: { receivedAt: "asc" },
    take: 100,
  });
}

export async function listRejectionReasonsAction() {
  const session = await requireTenantPermission("/lab/receipt");
  return prisma.sampleRejectionReason.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { displayName: "asc" },
  });
}

export async function searchTenantServicesAction(query: string) {
  const session = await requireTenantPermission("/lab/orders/new");
  const term = query.trim();
  if (term.length < 2) return [];
  return prisma.tenantService.findMany({
    where: {
      tenantId: session.tenantId,
      isActive: true,
      localName: { contains: term, mode: "insensitive" },
    },
    include: { sampleType: true, sampleContainer: true, department: true },
    take: 25,
    orderBy: { localName: "asc" },
  });
}

export async function createManualLabOrderAction(input: {
  patientId: string;
  doctorId?: string;
  tenantServiceIds: string[];
  priority?: LabOrderPriority;
  clinicalNote?: string;
}): Promise<LabOrderActionResult> {
  await requireTenantPermission("/lab/orders/manual", "canCreate");
  const session = await requireTenantSession();
  if (!session.branchId) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_BRANCH_ACCESS_DENIED };

  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: session.tenantId, isActive: true },
  });
  if (!patient) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_PATIENT_INVALID };

  const lines: LabOrderLineCreateInput[] = [];
  for (const serviceId of input.tenantServiceIds) {
    const line = await buildTestLineFromTenantService(session.tenantId, serviceId);
    if (line) lines.push(line);
  }
  if (!lines.length) return { ok: false, errorCode: LAB_ERROR_CODES.LAB_ORDER_EMPTY };

  const order = await prisma.$transaction(async (tx) => {
    return tx.labOrder.create({
      data: {
        tenantId: session.tenantId,
        branchId: session.branchId!,
        patientId: patient.id,
        doctorId: input.doctorId ?? null,
        orderNumber: await allocateLabOrderNumber(tx, session.tenantId),
        orderSource: "MANUAL",
        priority: input.priority ?? "ROUTINE",
        clinicalNote: input.clinicalNote?.trim() || null,
        createdById: session.userId,
        updatedById: session.userId,
        tests: {
          create: lines.map((line, index) => ({
            tenantId: session.tenantId,
            ...line,
            status: "ORDERED",
            sequence: index,
          })),
        },
      },
    });
  });

  await auditLabEvent({
    tenantId: session.tenantId,
    branchId: order.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "LAB_ORDER_MANUALLY_CREATED",
    entityType: "LabOrder",
    entityId: order.id,
  });

  revalidateLabPaths(order.id);
  return { ok: true, labOrderId: order.id, orderNumber: order.orderNumber };
}
