"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { generateReportPdfBuffer } from "@/lib/laboratory-report-release/pdf";
import { parseReportSnapshot } from "@/lib/laboratory-report-release/snapshot";
import { PORTAL_ERROR_CODES } from "@/lib/portal/errors";
import {
  findPortalReportForAccess,
  listAccessiblePatients,
  listPortalReports,
  type PortalReportRow,
} from "@/lib/portal/queries";
import { getPortalSession } from "@/lib/portal/session";

export type PortalReportsData = {
  patientName: string;
  patientNumber: string;
  expiresAt: Date;
  accessiblePatients: Array<{ patientName: string; relationship: string }>;
  reports: PortalReportRow[];
};

export type PortalDownloadResult =
  | { ok: true; fileName: string; base64: string }
  | { ok: false; errorCode: string };

async function clientIp(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/** Returns portal data for the signed-in account only. Never accepts a patient id argument. */
export async function getPortalReportsAction(): Promise<PortalReportsData | null> {
  const session = await getPortalSession();
  if (!session) return null;

  const accessiblePatients = await listAccessiblePatients(session.tenantId, session.accountId);
  const reports = await listPortalReports(
    session.tenantId,
    accessiblePatients.map((row) => row.patientId),
  );

  return {
    patientName: session.patientName,
    patientNumber: session.patientNumber,
    expiresAt: session.expiresAt,
    accessiblePatients: accessiblePatients.map((row) => ({
      patientName: row.patientName,
      relationship: row.relationship,
    })),
    reports,
  };
}

/**
 * Download authorization is re-evaluated on every request from the session, not from the
 * identifier the client supplies, so a guessed release id returns the same error as a
 * report that is not released.
 */
export async function downloadPortalReportAction(releaseId: string): Promise<PortalDownloadResult> {
  const session = await getPortalSession();
  if (!session) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_NOT_AUTHENTICATED };
  }

  const accessiblePatients = await listAccessiblePatients(session.tenantId, session.accountId);
  const release = await findPortalReportForAccess({
    tenantId: session.tenantId,
    releaseId,
    allowedPatientIds: accessiblePatients.map((row) => row.patientId),
  });

  if (!release || !release.currentVersion) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_REPORT_NOT_ACCESSIBLE };
  }

  const snapshot = parseReportSnapshot(release.currentVersion.snapshotJson);
  const token = release.verificationTokens[0]?.token ?? null;
  const pdfBuffer = await generateReportPdfBuffer(snapshot, token);
  const ipAddress = await clientIp();

  await prisma.$transaction(async (tx) => {
    await tx.labReportRelease.update({
      where: { id: release.id },
      data: { downloadCount: { increment: 1 } },
    });
    await tx.labReportAccessAudit.create({
      data: {
        tenantId: session.tenantId,
        branchId: release.branchId,
        releaseId: release.id,
        versionId: release.currentVersion!.id,
        accessMethod: "PDF_DOWNLOAD",
        accessedBy: `PORTAL:${session.patientNumber}`,
        ipAddress,
      },
    });
  });

  return {
    ok: true,
    fileName: `${release.reportNumber}.pdf`,
    base64: pdfBuffer.toString("base64"),
  };
}

/** Records that the patient opened the portal report list entry for a release. */
export async function recordPortalViewAction(releaseId: string): Promise<{ ok: boolean }> {
  const session = await getPortalSession();
  if (!session) return { ok: false };

  const accessiblePatients = await listAccessiblePatients(session.tenantId, session.accountId);
  const release = await findPortalReportForAccess({
    tenantId: session.tenantId,
    releaseId,
    allowedPatientIds: accessiblePatients.map((row) => row.patientId),
  });
  if (!release || !release.currentVersion) return { ok: false };

  await prisma.labReportAccessAudit.create({
    data: {
      tenantId: session.tenantId,
      branchId: release.branchId,
      releaseId: release.id,
      versionId: release.currentVersion.id,
      accessMethod: "PORTAL_VIEW",
      accessedBy: `PORTAL:${session.patientNumber}`,
      ipAddress: await clientIp(),
    },
  });

  return { ok: true };
}
