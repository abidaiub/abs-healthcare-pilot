import { prisma } from "@/lib/db";
import { PRESCRIPTION_ERROR_CODES } from "@/lib/prescription/errors";
import { validateBranchAccess, validateDoctorAtBranch } from "@/lib/consultation/queries";

export const prescriptionInclude = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
      gender: true,
      dateOfBirth: true,
      estimatedAge: true,
    },
  },
  doctor: {
    select: {
      id: true,
      doctorCode: true,
      doctorName: true,
      specialty: true,
      degree: true,
    },
  },
  branch: { select: { id: true, code: true, name: true } },
  department: { select: { id: true, name: true } },
  encounter: { select: { id: true, encounterNumber: true, status: true } },
  appointment: { select: { id: true, appointmentNumber: true } },
  medicines: { where: { isActive: true }, orderBy: { sequence: "asc" as const } },
  diagnoses: { where: { isActive: true }, orderBy: { sequence: "asc" as const } },
  investigations: { where: { isActive: true }, orderBy: { sequence: "asc" as const } },
} as const;

export async function assertTenantOwnsPrescription(tenantId: string, prescriptionId: string) {
  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, tenantId },
  });
  if (!prescription) {
    throw new Error(PRESCRIPTION_ERROR_CODES.PRESCRIPTION_NOT_FOUND);
  }
  return prescription;
}

export async function getPrescriptionById(tenantId: string, prescriptionId: string) {
  return prisma.prescription.findFirst({
    where: { id: prescriptionId, tenantId },
    include: prescriptionInclude,
  });
}

export async function findCurrentDraftForEncounter(tenantId: string, encounterId: string) {
  return prisma.prescription.findFirst({
    where: {
      tenantId,
      encounterId,
      status: "DRAFT",
      isCurrentVersion: true,
    },
    include: prescriptionInclude,
  });
}

export async function findCurrentPrescriptionForEncounter(tenantId: string, encounterId: string) {
  return prisma.prescription.findFirst({
    where: {
      tenantId,
      encounterId,
      isCurrentVersion: true,
      status: { in: ["DRAFT", "FINALIZED"] },
    },
    include: prescriptionInclude,
  });
}

export async function listPrescriptionVersions(tenantId: string, prescriptionNumber: string) {
  return prisma.prescription.findMany({
    where: { tenantId, prescriptionNumber },
    include: {
      ...prescriptionInclude,
    },
    orderBy: { versionNumber: "desc" },
  });
}

export async function listPrescriptions(
  tenantId: string,
  filters: {
    patientId?: string;
    branchId?: string;
    doctorId?: string;
    currentOnly?: boolean;
    limit?: number;
  } = {},
) {
  return prisma.prescription.findMany({
    where: {
      tenantId,
      ...(filters.patientId ? { patientId: filters.patientId } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(filters.currentOnly ? { isCurrentVersion: true, status: { in: ["DRAFT", "FINALIZED"] } } : {}),
    },
    include: {
      patient: { select: { patientNumber: true, fullName: true } },
      doctor: { select: { doctorName: true, doctorCode: true } },
      branch: { select: { code: true, name: true } },
      encounter: { select: { encounterNumber: true } },
    },
    orderBy: { prescribedAt: "desc" },
    take: filters.limit ?? 50,
  });
}

export async function validateEncounterForPrescription(
  tenantId: string,
  encounterId: string,
  userId: string,
) {
  const encounter = await prisma.clinicalEncounter.findFirst({
    where: { id: encounterId, tenantId, isActive: true },
    include: {
      diagnoses: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      medicines: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      investigations: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!encounter) {
    return { ok: false as const, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_ENCOUNTER_INVALID };
  }
  if (encounter.status === "CANCELLED") {
    return { ok: false as const, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_ENCOUNTER_CANCELLED };
  }
  if (!["IN_PROGRESS", "COMPLETED"].includes(encounter.status)) {
    return { ok: false as const, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_ENCOUNTER_INVALID };
  }

  const branchAccess = await validateBranchAccess(tenantId, encounter.branchId, userId);
  if (!branchAccess) {
    return { ok: false as const, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_BRANCH_UNAUTHORIZED };
  }

  const doctorAtBranch = await validateDoctorAtBranch(
    tenantId,
    encounter.doctorId,
    encounter.branchId,
  );
  if (!doctorAtBranch) {
    return { ok: false as const, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_ENCOUNTER_INVALID };
  }

  return { ok: true as const, encounter };
}
