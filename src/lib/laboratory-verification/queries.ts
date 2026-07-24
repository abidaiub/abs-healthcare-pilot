import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { LAB_VERIFICATION_ERROR_CODES } from "@/lib/laboratory-verification/errors";
import { labResultInclude } from "@/lib/laboratory-result/queries";

export const verificationReviewInclude = {
  ...labResultInclude,
  verifications: { orderBy: { verificationSequence: "desc" as const } },
  correctionRequests: {
    where: { status: { in: ["OPEN", "IN_PROGRESS"] as ("OPEN" | "IN_PROGRESS")[] } },
    orderBy: { requestedAt: "desc" as const },
  },
};

export async function assertTenantOwnsVerificationResult(
  tenantId: string,
  labResultId: string,
): Promise<Prisma.LabResultGetPayload<{ include: typeof verificationReviewInclude }>> {
  const result = await prisma.labResult.findFirst({
    where: { id: labResultId, tenantId },
    include: verificationReviewInclude,
  });
  if (!result) throw new Error(LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_NOT_FOUND);
  return result;
}

export async function listVerificationWorklist(tenantId: string, branchId?: string) {
  return prisma.labResult.findMany({
    where: {
      tenantId,
      status: "READY_FOR_VERIFICATION",
      ...(branchId ? { branchId } : {}),
    },
    include: {
      labOrder: {
        include: {
          patient: { select: { patientNumber: true, fullName: true, gender: true, dateOfBirth: true } },
          branch: { select: { code: true, name: true } },
          doctor: { select: { doctorName: true } },
        },
      },
      labOrderTest: {
        include: { department: { select: { id: true, name: true, deptCode: true } } },
      },
      labSample: {
        select: {
          accessionNumber: true,
          collectedAt: true,
          receivedAt: true,
          sampleStatus: true,
        },
      },
      items: { select: { abnormalFlag: true, isCritical: true } },
      criticalEvents: { select: { id: true, acknowledgedAt: true } },
    },
    orderBy: [{ entryCompletedAt: "asc" }],
    take: 200,
  });
}

export async function listCorrectionWorklist(tenantId: string, branchId?: string) {
  return prisma.labResultCorrectionRequest.findMany({
    where: {
      tenantId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
      labResult: {
        ...(branchId ? { branchId } : {}),
      },
    },
    include: {
      labResult: {
        include: {
          labOrder: {
            include: {
              patient: { select: { patientNumber: true, fullName: true } },
              branch: { select: { code: true, name: true } },
            },
          },
          labOrderTest: { select: { testName: true, department: { select: { name: true } } } },
          labSample: { select: { accessionNumber: true } },
        },
      },
      verification: {
        select: {
          verifierDisplayNameSnapshot: true,
          rejectedAt: true,
          rejectionReasonCode: true,
          rejectionReasonText: true,
          affectedParameterIds: true,
        },
      },
    },
    orderBy: { requestedAt: "asc" },
    take: 200,
  });
}

export async function allocateVerificationSequence(
  tx: Prisma.TransactionClient,
  labResultId: string,
): Promise<number> {
  const last = await tx.labResultVerification.findFirst({
    where: { labResultId },
    orderBy: { verificationSequence: "desc" },
    select: { verificationSequence: true },
  });
  return (last?.verificationSequence ?? 0) + 1;
}

export async function resolveVerifierSnapshot(tenantId: string, userId: string, actorName: string) {
  const doctor = await prisma.doctor.findFirst({
    where: { tenantId, userId, isActive: true },
    select: { doctorName: true, degree: true, specialty: true, bmdcNo: true, isPathologist: true },
  });
  return {
    displayName: doctor?.doctorName ?? actorName,
    designation: doctor?.specialty ?? doctor?.degree ?? null,
    registrationNumber: doctor?.bmdcNo ?? null,
  };
}
