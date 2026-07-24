import type { LabOrderTestStatus, LabOrderStatus, LabSampleStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { LAB_ERROR_CODES } from "@/lib/laboratory/errors";

export const labOrderInclude = {
  patient: { select: { id: true, patientNumber: true, fullName: true, gender: true, dateOfBirth: true } },
  doctor: { select: { id: true, doctorCode: true, doctorName: true } },
  branch: { select: { id: true, code: true, name: true } },
  tests: {
    include: {
      tenantService: { select: { id: true, localName: true } },
      sampleType: true,
      sampleContainer: true,
      department: { select: { id: true, deptCode: true, name: true } },
    },
    orderBy: { sequence: "asc" as const },
  },
  samples: {
    include: {
      sampleType: true,
      sampleContainer: true,
      rejectionReason: true,
      sampleTests: { include: { labOrderTest: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export async function assertTenantOwnsLabOrder(tenantId: string, labOrderId: string) {
  const order = await prisma.labOrder.findFirst({
    where: { id: labOrderId, tenantId },
    include: labOrderInclude,
  });
  if (!order) throw new Error(LAB_ERROR_CODES.LAB_ORDER_NOT_FOUND);
  return order;
}

export async function assertTenantOwnsLabSample(tenantId: string, sampleId: string) {
  const sample = await prisma.labSample.findFirst({
    where: { id: sampleId, tenantId },
    include: {
      labOrder: { include: labOrderInclude },
      sampleType: true,
      sampleContainer: true,
      rejectionReason: true,
      sampleTests: { include: { labOrderTest: true } },
    },
  });
  if (!sample) throw new Error(LAB_ERROR_CODES.LAB_SAMPLE_NOT_FOUND);
  return sample;
}

export async function findDraftLabOrderForEncounter(tenantId: string, encounterId: string) {
  return prisma.labOrder.findFirst({
    where: { tenantId, encounterId, status: "DRAFT" },
    include: labOrderInclude,
  });
}

export async function findDraftLabOrderForPrescription(tenantId: string, prescriptionId: string) {
  return prisma.labOrder.findFirst({
    where: { tenantId, prescriptionId, status: "DRAFT" },
    include: labOrderInclude,
  });
}

export async function listLabOrders(tenantId: string, branchId?: string) {
  return prisma.labOrder.findMany({
    where: {
      tenantId,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      patient: { select: { patientNumber: true, fullName: true } },
      doctor: { select: { doctorName: true } },
      branch: { select: { code: true, name: true } },
      tests: { select: { id: true, status: true } },
    },
    orderBy: { orderedAt: "desc" },
    take: 200,
  });
}

export async function syncLabOrderStatusFromTests(labOrderId: string, tenantId: string) {
  const tests = await prisma.labOrderTest.findMany({
    where: { labOrderId, tenantId, status: { not: "CANCELLED" } },
  });
  if (!tests.length) return;

  const statuses = tests.map((t) => t.status);
  let nextStatus: LabOrderStatus | null = null;

  if (statuses.every((s) => s === "READY_FOR_RESULT" || s === "COMPLETED")) {
    nextStatus = statuses.every((s) => s === "COMPLETED") ? "COMPLETED" : "READY_FOR_RESULT";
  } else if (statuses.some((s) => s === "IN_PROCESS" || s === "SAMPLE_RECEIVED")) {
    nextStatus = "IN_PROCESS";
  } else if (statuses.every((s) => s === "SAMPLE_RECEIVED" || s === "SAMPLE_COLLECTED")) {
    nextStatus = statuses.every((s) => s === "SAMPLE_RECEIVED") ? "RECEIVED" : "COLLECTED";
  } else if (statuses.some((s) => s === "SAMPLE_COLLECTED")) {
    nextStatus = statuses.every((s) => s === "SAMPLE_COLLECTED" || s === "COMPLETED")
      ? "COLLECTED"
      : "PARTIALLY_COLLECTED";
  }

  if (nextStatus) {
    await prisma.labOrder.updateMany({
      where: { id: labOrderId, tenantId, status: { notIn: ["CANCELLED", "DRAFT"] } },
      data: { status: nextStatus },
    });
  }
}

export function deriveSampleStatusFromTests(statuses: LabOrderTestStatus[]): LabSampleStatus {
  if (statuses.every((s) => s === "READY_FOR_RESULT" || s === "COMPLETED")) {
    return statuses.every((s) => s === "COMPLETED") ? "COMPLETED" : "READY_FOR_RESULT";
  }
  if (statuses.some((s) => s === "IN_PROCESS" || s === "SAMPLE_RECEIVED")) return "IN_PROCESS";
  if (statuses.every((s) => s === "SAMPLE_RECEIVED")) return "RECEIVED";
  if (statuses.some((s) => s === "SAMPLE_COLLECTED")) return "COLLECTED";
  return "PENDING_COLLECTION";
}
