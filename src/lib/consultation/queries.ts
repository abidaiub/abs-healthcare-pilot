import { prisma } from "@/lib/db";
import { ENCOUNTER_ERROR_CODES } from "@/lib/consultation/errors";
import { startOfDay } from "@/lib/consultation/constants";
import type { ClinicalEncounterStatus } from "@/generated/prisma/client";

export const encounterInclude = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
      gender: true,
      dateOfBirth: true,
      estimatedAge: true,
      mobile: true,
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
  department: { select: { id: true, name: true, deptCode: true } },
  appointment: {
    select: {
      id: true,
      appointmentNumber: true,
      status: true,
      queueToken: true,
      appointmentDate: true,
      timeSlot: true,
    },
  },
  vitals: true,
  diagnoses: { where: { isActive: true }, orderBy: { sortOrder: "asc" as const } },
  medicines: { where: { isActive: true }, orderBy: { sortOrder: "asc" as const } },
  investigations: { where: { isActive: true }, orderBy: { sortOrder: "asc" as const } },
} as const;

export async function assertTenantOwnsEncounter(tenantId: string, encounterId: string) {
  const encounter = await prisma.clinicalEncounter.findFirst({
    where: { id: encounterId, tenantId, isActive: true },
  });
  if (!encounter) {
    throw new Error(ENCOUNTER_ERROR_CODES.ENCOUNTER_NOT_FOUND);
  }
  return encounter;
}

export async function getEncounterById(tenantId: string, encounterId: string) {
  return prisma.clinicalEncounter.findFirst({
    where: { id: encounterId, tenantId, isActive: true },
    include: encounterInclude,
  });
}

export async function findActiveEncounterForAppointment(
  tenantId: string,
  appointmentId: string,
) {
  return prisma.clinicalEncounter.findFirst({
    where: {
      tenantId,
      appointmentId,
      isActive: true,
      status: { in: ["DRAFT", "IN_PROGRESS"] },
    },
    include: encounterInclude,
  });
}

export type ConsultationWorklistFilters = {
  branchId?: string;
  doctorId?: string;
  consultationDate?: Date;
  status?: ClinicalEncounterStatus[];
};

export async function listConsultationWorklist(
  tenantId: string,
  filters: ConsultationWorklistFilters = {},
) {
  const consultationDate = filters.consultationDate
    ? startOfDay(filters.consultationDate)
    : startOfDay(new Date());

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      appointmentDate: consultationDate,
      status: { in: ["WAITING", "CALLED", "IN_CONSULTATION"] },
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
    },
    include: {
      patient: {
        select: { patientNumber: true, fullName: true, gender: true, dateOfBirth: true, estimatedAge: true },
      },
      doctor: { select: { doctorCode: true, doctorName: true } },
      department: { select: { name: true } },
      branch: { select: { code: true, name: true } },
    },
    orderBy: [{ queueToken: "asc" }, { timeSlot: "asc" }],
  });

  const encounters = await prisma.clinicalEncounter.findMany({
    where: {
      tenantId,
      consultationDate,
      status: { in: ["DRAFT", "IN_PROGRESS"] },
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
    },
    select: { id: true, appointmentId: true, status: true, encounterNumber: true },
  });

  const encounterByAppointment = new Map(
    encounters
      .filter((row) => row.appointmentId)
      .map((row) => [row.appointmentId!, row]),
  );

  return appointments.map((appointment) => ({
    appointment,
    encounter: encounterByAppointment.get(appointment.id) ?? null,
  }));
}

export async function listEncounters(
  tenantId: string,
  filters: {
    patientId?: string;
    branchId?: string;
    doctorId?: string;
    status?: ClinicalEncounterStatus;
    limit?: number;
  } = {},
) {
  return prisma.clinicalEncounter.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(filters.patientId ? { patientId: filters.patientId } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: {
      patient: { select: { patientNumber: true, fullName: true } },
      doctor: { select: { doctorName: true, doctorCode: true } },
      branch: { select: { code: true, name: true } },
      appointment: { select: { appointmentNumber: true, queueToken: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 50,
  });
}

export async function validateDoctorAtBranch(
  tenantId: string,
  doctorId: string,
  branchId: string,
) {
  const doctor = await prisma.doctor.findFirst({
    where: {
      id: doctorId,
      tenantId,
      isActive: true,
      doctorBranches: { some: { branchId, isActive: true } },
    },
    select: { id: true, departmentId: true },
  });
  return doctor;
}

export async function validateBranchAccess(
  tenantId: string,
  branchId: string,
  userId: string,
) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId, isActive: true },
  });
  if (!branch) return null;

  const assignment = await prisma.userBranch.findFirst({
    where: { tenantId, userId, branchId, isActive: true },
  });
  if (!assignment) return null;

  return branch;
}
