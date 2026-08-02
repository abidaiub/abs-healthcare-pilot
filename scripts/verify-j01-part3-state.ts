import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { findPortalReportForAccess } from "../src/lib/portal/queries";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const patient = await prisma.patient.findFirst({
    where: { patientNumber: "PT-000009", tenant: { tenantCode: "DPDC" } },
    select: { id: true, tenantId: true, patientNumber: true, fullName: true },
  });
  if (!patient) throw new Error("PT-000009 not found");
  const portalAccounts = await prisma.patientPortalAccount.findMany({
    where: { patientId: patient.id },
    select: { id: true, username: true, isActive: true, isSuspended: true, failedAttemptCount: true },
  });
  const releases = await prisma.labReportRelease.findMany({
    where: { labResult: { labOrder: { patientId: patient.id } } },
    select: { id: true, reportNumber: true, status: true, portalPublishedAt: true, downloadCount: true },
    orderBy: { reportNumber: "asc" },
  });
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: patient.id, prescriptionNumber: "RX-000004" },
    select: {
      id: true,
      prescriptionNumber: true,
      versionNumber: true,
      status: true,
      isCurrentVersion: true,
      supersedesPrescriptionId: true,
      revisionReason: true,
      followUpIntervalDays: true,
      followUpInstructions: true,
      medicines: {
        select: { medicineName: true, strength: true, dose: true, frequency: true, durationValue: true, durationUnit: true },
      },
    },
    orderBy: { versionNumber: "asc" },
  });
  const tshRelease = releases.find((release) => release.reportNumber === "RPT-0000012");
  if (!tshRelease) throw new Error("RPT-0000012 not found");
  const downloadAudits = await prisma.labReportAccessAudit.findMany({
    where: { releaseId: tshRelease.id },
    select: { accessMethod: true, accessedBy: true, accessedAt: true },
    orderBy: { accessedAt: "desc" },
  });
  const anotherPatientRelease = await prisma.labReportRelease.findFirst({
    where: { tenantId: patient.tenantId, labResult: { labOrder: { patientId: { not: patient.id } } } },
    select: { id: true, reportNumber: true, tenantId: true },
  });
  const crossPatientDenied = anotherPatientRelease
    ? (await findPortalReportForAccess({
        tenantId: anotherPatientRelease.tenantId,
        releaseId: anotherPatientRelease.id,
        allowedPatientIds: [patient.id],
      })) === null
    : true;
  const v1 = prescriptions.find((prescription) => prescription.versionNumber === 1);
  const v2 = prescriptions.find((prescription) => prescription.versionNumber === 2);
  const checks = {
    portalAccountActive: portalAccounts.some((account) => account.isActive && !account.isSuspended),
    exactlyThreePublishedReports: releases.length === 3 && releases.every((release) => release.portalPublishedAt),
    tshDownloadAudited: tshRelease.downloadCount >= 2 && downloadAudits.length >= 2,
    crossPatientDenied,
    v1PreservedAndSuperseded: v1?.status === "SUPERSEDED" && !v1.isCurrentVersion,
    v2FinalizedAndCurrent: v2?.status === "FINALIZED" && v2.isCurrentVersion && v2.supersedesPrescriptionId === v1?.id,
    revisionReasonRecorded: Boolean(v2?.revisionReason),
    followUpRecorded: v2?.followUpIntervalDays === 42 && v2.followUpInstructions === "Repeat TSH in 6 weeks.",
    treatmentRecorded: v2?.medicines.some(
      (medicine) => medicine.medicineName === "Levothyroxine" && medicine.strength === "50 mcg" && medicine.frequency === "OD",
    ),
  };
  if (Object.values(checks).some((passed) => !passed)) throw new Error(`J-01 Part 3 verification failed: ${JSON.stringify(checks)}`);
  console.log(JSON.stringify({ patient, portalAccounts, releases, downloadAudits, prescriptions, checks }, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
