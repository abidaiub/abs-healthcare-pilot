import { prisma } from "@/lib/db";

export type PortalAccessiblePatient = {
  patientId: string;
  patientNumber: string;
  patientName: string;
  /** SELF for the account owner, or the recorded delegation relationship. */
  relationship: string;
  accessLevel: string;
};

/**
 * Every patient this account may read: itself plus any patient that has an explicit,
 * active delegation grant. Guardian access is never inferred from demographic fields.
 */
export async function listAccessiblePatients(
  tenantId: string,
  accountId: string,
): Promise<PortalAccessiblePatient[]> {
  const account = await prisma.patientPortalAccount.findFirst({
    where: { id: accountId, tenantId, isActive: true, isSuspended: false },
    include: {
      patient: { select: { id: true, patientNumber: true, fullName: true } },
      delegations: {
        where: { isActive: true, revokedAt: null },
        include: {
          grantorPatient: { select: { id: true, patientNumber: true, fullName: true } },
        },
      },
    },
  });
  if (!account) return [];

  const rows: PortalAccessiblePatient[] = [
    {
      patientId: account.patient.id,
      patientNumber: account.patient.patientNumber,
      patientName: account.patient.fullName,
      relationship: "SELF",
      accessLevel: "FULL",
    },
  ];

  for (const delegation of account.delegations) {
    rows.push({
      patientId: delegation.grantorPatient.id,
      patientNumber: delegation.grantorPatient.patientNumber,
      patientName: delegation.grantorPatient.fullName,
      relationship: delegation.relationship,
      accessLevel: delegation.accessLevel,
    });
  }

  return rows;
}

export type PortalReportRow = {
  releaseId: string;
  reportNumber: string;
  patientId: string;
  patientName: string;
  testName: string;
  versionNumber: number;
  releasedAt: Date | null;
  portalPublishedAt: Date | null;
  isSuperseded: boolean;
  branchName: string;
};

/**
 * Released and portal-published reports only. Unverified, withdrawn, held or unpublished
 * reports are excluded at the query level so they can never reach a portal response.
 */
export async function listPortalReports(
  tenantId: string,
  patientIds: string[],
): Promise<PortalReportRow[]> {
  if (!patientIds.length) return [];

  const releases = await prisma.labReportRelease.findMany({
    where: {
      tenantId,
      status: "RELEASED",
      portalPublishedAt: { not: null },
      withdrawnAt: null,
      labResult: { labOrder: { patientId: { in: patientIds } } },
    },
    include: {
      branch: { select: { name: true } },
      currentVersion: { select: { versionNumber: true, status: true, releasedAt: true } },
      labResult: {
        select: {
          labOrderTest: { select: { testName: true } },
          labOrder: { select: { patientId: true, patient: { select: { fullName: true } } } },
        },
      },
    },
    orderBy: [{ releasedAt: "desc" }],
    take: 200,
  });

  return releases
    .filter((release) => release.currentVersion !== null)
    .map((release) => ({
      releaseId: release.id,
      reportNumber: release.reportNumber,
      patientId: release.labResult.labOrder.patientId,
      patientName: release.labResult.labOrder.patient.fullName,
      testName: release.labResult.labOrderTest?.testName ?? "",
      versionNumber: release.currentVersion?.versionNumber ?? 1,
      releasedAt: release.releasedAt,
      portalPublishedAt: release.portalPublishedAt,
      isSuperseded: release.currentVersion?.status === "SUPERSEDED",
      branchName: release.branch.name,
    }));
}

/**
 * Re-checks ownership and release state for a single report. Called on every view and
 * download request rather than trusting a list result the client already holds.
 */
export async function findPortalReportForAccess(input: {
  tenantId: string;
  releaseId: string;
  allowedPatientIds: string[];
}) {
  if (!input.allowedPatientIds.length) return null;

  return prisma.labReportRelease.findFirst({
    where: {
      id: input.releaseId,
      tenantId: input.tenantId,
      status: "RELEASED",
      portalPublishedAt: { not: null },
      withdrawnAt: null,
      labResult: { labOrder: { patientId: { in: input.allowedPatientIds } } },
    },
    include: {
      currentVersion: true,
      verificationTokens: {
        where: { isRevoked: false },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}
