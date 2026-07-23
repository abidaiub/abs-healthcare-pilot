import { prisma } from "@/lib/db";
import type { PatientFormInput } from "@/lib/patient/validation";

export type DuplicateMatch = {
  patientId: string;
  patientNumber: string;
  fullName: string;
  matchType: "MOBILE" | "NATIONAL_ID" | "PASSPORT" | "NAME_DOB" | "NAME_GUARDIAN_MOBILE";
  severity: "critical" | "warning";
};

export async function findPatientDuplicates(
  tenantId: string,
  input: PatientFormInput,
  excludePatientId?: string,
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const notSelf = excludePatientId ? { NOT: { id: excludePatientId } } : {};

  if (input.nationalIdNormalized) {
    const rows = await prisma.patient.findMany({
      where: {
        tenantId,
        nationalIdNormalized: input.nationalIdNormalized,
        ...notSelf,
      },
      select: { id: true, patientNumber: true, fullName: true },
      take: 5,
    });
    for (const row of rows) {
      matches.push({
        patientId: row.id,
        patientNumber: row.patientNumber,
        fullName: row.fullName,
        matchType: "NATIONAL_ID",
        severity: "critical",
      });
    }
  }

  if (input.mobileNormalized) {
    const rows = await prisma.patient.findMany({
      where: {
        tenantId,
        mobileNormalized: input.mobileNormalized,
        ...notSelf,
      },
      select: { id: true, patientNumber: true, fullName: true },
      take: 5,
    });
    for (const row of rows) {
      if (matches.some((m) => m.patientId === row.id)) continue;
      matches.push({
        patientId: row.id,
        patientNumber: row.patientNumber,
        fullName: row.fullName,
        matchType: "MOBILE",
        severity: "warning",
      });
    }
  }

  if (input.passportNumberNormalized) {
    const rows = await prisma.patient.findMany({
      where: {
        tenantId,
        passportNumberNormalized: input.passportNumberNormalized,
        ...notSelf,
      },
      select: { id: true, patientNumber: true, fullName: true },
      take: 5,
    });
    for (const row of rows) {
      if (matches.some((m) => m.patientId === row.id)) continue;
      matches.push({
        patientId: row.id,
        patientNumber: row.patientNumber,
        fullName: row.fullName,
        matchType: "PASSPORT",
        severity: "warning",
      });
    }
  }

  if (input.dateOfBirth && input.fullName) {
    const rows = await prisma.patient.findMany({
      where: {
        tenantId,
        dateOfBirth: input.dateOfBirth,
        fullName: { equals: input.fullName, mode: "insensitive" },
        ...notSelf,
      },
      select: { id: true, patientNumber: true, fullName: true },
      take: 5,
    });
    for (const row of rows) {
      if (matches.some((m) => m.patientId === row.id)) continue;
      matches.push({
        patientId: row.id,
        patientNumber: row.patientNumber,
        fullName: row.fullName,
        matchType: "NAME_DOB",
        severity: "warning",
      });
    }
  }

  if (input.fullName && input.guardianMobileNormalized) {
    const rows = await prisma.patient.findMany({
      where: {
        tenantId,
        fullName: { equals: input.fullName, mode: "insensitive" },
        guardianMobileNormalized: input.guardianMobileNormalized,
        ...notSelf,
      },
      select: { id: true, patientNumber: true, fullName: true },
      take: 5,
    });
    for (const row of rows) {
      if (matches.some((m) => m.patientId === row.id)) continue;
      matches.push({
        patientId: row.id,
        patientNumber: row.patientNumber,
        fullName: row.fullName,
        matchType: "NAME_GUARDIAN_MOBILE",
        severity: "warning",
      });
    }
  }

  return matches;
}

export function hasCriticalDuplicate(matches: DuplicateMatch[]): boolean {
  return matches.some((match) => match.severity === "critical");
}
