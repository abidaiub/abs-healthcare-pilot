import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { LAB_REPORT_RELEASE_ERROR_CODES } from "@/lib/laboratory-report-release/errors";
import { verificationReviewInclude } from "@/lib/laboratory-verification/queries";

export const releaseDetailInclude = {
  labResult: {
    include: verificationReviewInclude,
  },
  currentVersion: true,
  versions: { orderBy: { versionNumber: "desc" as const } },
  verificationTokens: {
    where: { isRevoked: false },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} satisfies Prisma.LabReportReleaseInclude;

export type ReleaseDetail = Prisma.LabReportReleaseGetPayload<{
  include: typeof releaseDetailInclude;
}>;

export async function assertTenantOwnsRelease(
  tenantId: string,
  releaseId: string,
): Promise<ReleaseDetail> {
  const release = await prisma.labReportRelease.findFirst({
    where: { id: releaseId, tenantId },
    include: releaseDetailInclude,
  });
  if (!release) throw new Error(LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND);
  return release;
}

export async function assertTenantOwnsReleaseByResult(
  tenantId: string,
  labResultId: string,
): Promise<ReleaseDetail | null> {
  return prisma.labReportRelease.findFirst({
    where: { tenantId, labResultId },
    include: releaseDetailInclude,
  });
}

export async function listReleaseQueue(tenantId: string, branchId?: string) {
  const pendingReleases = await prisma.labReportRelease.findMany({
    where: {
      tenantId,
      status: { in: ["RELEASE_PENDING", "AMENDED"] },
      ...(branchId ? { branchId } : {}),
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
          labOrderTest: { select: { testName: true } },
          labSample: { select: { accessionNumber: true } },
        },
      },
      currentVersion: { select: { versionNumber: true, status: true } },
    },
    orderBy: [{ createdAt: "asc" }],
    take: 200,
  });

  const verifiedWithoutRelease = await prisma.labResult.findMany({
    where: {
      tenantId,
      status: "VERIFIED",
      reportRelease: null,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      labOrder: {
        include: {
          patient: { select: { patientNumber: true, fullName: true } },
          branch: { select: { code: true, name: true } },
        },
      },
      labOrderTest: { select: { testName: true } },
      labSample: { select: { accessionNumber: true } },
    },
    orderBy: [{ entryCompletedAt: "asc" }],
    take: 200,
  });

  return { pendingReleases, verifiedWithoutRelease };
}

export async function listReleaseHistory(tenantId: string, branchId?: string) {
  return prisma.labReportRelease.findMany({
    where: {
      tenantId,
      status: { in: ["RELEASED", "WITHDRAWN", "AMENDED"] },
      ...(branchId ? { branchId } : {}),
    },
    include: {
      labResult: {
        include: {
          labOrder: {
            include: {
              patient: { select: { patientNumber: true, fullName: true } },
            },
          },
          labOrderTest: { select: { testName: true } },
        },
      },
      currentVersion: { select: { versionNumber: true, releasedAt: true } },
    },
    orderBy: [{ releasedAt: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });
}

export async function findVerificationToken(token: string) {
  return prisma.labReportVerificationToken.findUnique({
    where: { token },
    include: {
      release: {
        select: {
          id: true,
          tenantId: true,
          branchId: true,
          reportNumber: true,
          status: true,
          portalPublishEligible: true,
          withdrawnAt: true,
          currentVersionId: true,
        },
      },
      version: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          isCurrent: true,
        },
      },
    },
  });
}
