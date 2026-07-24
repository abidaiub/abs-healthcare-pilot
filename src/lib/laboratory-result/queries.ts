import { prisma } from "@/lib/db";
import { LAB_RESULT_ERROR_CODES } from "@/lib/laboratory-result/errors";

export const labResultInclude = {
  labOrder: {
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          fullName: true,
          gender: true,
          dateOfBirth: true,
        },
      },
      doctor: { select: { id: true, doctorName: true } },
      branch: { select: { id: true, code: true, name: true } },
    },
  },
  labOrderTest: {
    include: {
      department: { select: { id: true, deptCode: true, name: true } },
      tenantService: { select: { id: true, localName: true } },
    },
  },
  labSample: {
    include: {
      sampleType: true,
      sampleContainer: true,
    },
  },
  items: { orderBy: { displayOrder: "asc" as const } },
  criticalEvents: { orderBy: { detectedAt: "desc" as const } },
} as const;

export async function assertTenantOwnsLabResult(tenantId: string, labResultId: string) {
  const result = await prisma.labResult.findFirst({
    where: { id: labResultId, tenantId },
    include: labResultInclude,
  });
  if (!result) throw new Error(LAB_RESULT_ERROR_CODES.LAB_RESULT_NOT_FOUND);
  return result;
}

export async function findActiveLabResultForOrderTest(tenantId: string, labOrderTestId: string) {
  return prisma.labResult.findFirst({
    where: {
      tenantId,
      labOrderTestId,
      status: { not: "CANCELLED" },
    },
    include: labResultInclude,
  });
}

export async function listResultEntryWorklist(tenantId: string, branchId?: string) {
  return prisma.labOrderTest.findMany({
    where: {
      tenantId,
      status: { in: ["READY_FOR_RESULT", "RESULT_IN_PROGRESS", "READY_FOR_VERIFICATION"] },
      labOrder: {
        status: { notIn: ["CANCELLED", "DRAFT"] },
        ...(branchId ? { branchId } : {}),
      },
    },
    include: {
      labOrder: {
        include: {
          patient: { select: { patientNumber: true, fullName: true } },
          branch: { select: { code: true, name: true } },
        },
      },
      department: { select: { name: true } },
      labResult: { select: { id: true, status: true, enteredAt: true } },
      sampleTests: {
        include: {
          labSample: {
            select: {
              id: true,
              accessionNumber: true,
              sampleStatus: true,
              receivedAt: true,
              collectedAt: true,
            },
          },
        },
      },
    },
    orderBy: [{ labOrder: { priority: "desc" } }, { labOrder: { orderedAt: "asc" } }],
    take: 200,
  });
}
