import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { LAB_LIS_ERROR_CODES } from "@/lib/laboratory-lis/errors";

export const importQueueInclude = {
  analyzer: { select: { id: true, analyzerCode: true, machineName: true } },
  labSample: { select: { id: true, accessionNumber: true, sampleStatus: true } },
  labOrderTest: { select: { id: true, testName: true, status: true } },
  labResult: { select: { id: true, status: true } },
  errors: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.AnalyzerImportQueueInclude;

export type ImportQueueRow = Prisma.AnalyzerImportQueueGetPayload<{
  include: typeof importQueueInclude;
}>;

export async function assertTenantOwnsImportMessage(tenantId: string, queueId: string) {
  const row = await prisma.analyzerImportQueue.findFirst({
    where: { id: queueId, tenantId },
    include: importQueueInclude,
  });
  if (!row) throw new Error(LAB_LIS_ERROR_CODES.LAB_LIS_NOT_FOUND);
  return row;
}

export async function listImportQueue(tenantId: string, branchId?: string) {
  return prisma.analyzerImportQueue.findMany({
    where: { tenantId, ...(branchId ? { branchId } : {}) },
    include: importQueueInclude,
    orderBy: [{ receivedAt: "desc" }],
    take: 200,
  });
}

export async function listAnalyzerMappings(tenantId: string, analyzerId?: string) {
  return prisma.analyzerMapping.findMany({
    where: { tenantId, ...(analyzerId ? { analyzerId } : {}) },
    include: {
      analyzer: { select: { id: true, analyzerCode: true, machineName: true } },
      tenantService: { select: { id: true, localName: true } },
    },
    orderBy: [{ machineTestCode: "asc" }],
    take: 500,
  });
}

export async function countOpenImportErrors(tenantId: string, branchId?: string) {
  return prisma.analyzerImportQueue.count({
    where: {
      tenantId,
      ...(branchId ? { branchId } : {}),
      processedStatus: { in: ["PENDING", "ERROR", "QUARANTINED"] },
    },
  });
}
