import type { PatientGender, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { formatPatientDisplayAge } from "@/lib/patient/normalize";

export type PatientListFilters = {
  search?: string;
  status?: "all" | "active" | "inactive";
  gender?: PatientGender | "all";
  registrationBranchId?: string | "all";
  page?: number;
  pageSize?: number;
};

export type PatientListRow = {
  id: string;
  patientNumber: string;
  fullName: string;
  gender: PatientGender;
  mobile: string | null;
  dateOfBirth: Date | null;
  estimatedAge: number | null;
  ageAsOfDate: Date | null;
  displayAge: string;
  registrationBranchId: string;
  registrationBranchCode: string;
  registrationBranchName: string;
  isActive: boolean;
  updatedAt: Date;
};

function patientWhere(tenantId: string, filters: PatientListFilters): Prisma.PatientWhereInput {
  const where: Prisma.PatientWhereInput = { tenantId };

  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;

  if (filters.gender && filters.gender !== "all") {
    where.gender = filters.gender;
  }

  if (filters.registrationBranchId && filters.registrationBranchId !== "all") {
    where.registrationBranchId = filters.registrationBranchId;
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { patientNumber: { contains: q, mode: "insensitive" } },
      { fullName: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q, mode: "insensitive" } },
      { mobileNormalized: { contains: q.replace(/\D/g, ""), mode: "insensitive" } },
    ];
  }

  return where;
}

export { formatPatientDisplayAge };

export async function listPatients(
  tenantId: string,
  filters: PatientListFilters = {},
): Promise<{
  rows: PatientListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const where = patientWhere(tenantId, filters);

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        registrationBranch: { select: { id: true, code: true, name: true } },
      },
    }),
  ]);

  return {
    rows: patients.map((patient) => ({
      id: patient.id,
      patientNumber: patient.patientNumber,
      fullName: patient.fullName,
      gender: patient.gender,
      mobile: patient.mobile,
      dateOfBirth: patient.dateOfBirth,
      estimatedAge: patient.estimatedAge,
      ageAsOfDate: patient.ageAsOfDate,
      displayAge: formatPatientDisplayAge(patient),
      registrationBranchId: patient.registrationBranchId,
      registrationBranchCode: patient.registrationBranch.code,
      registrationBranchName: patient.registrationBranch.name,
      isActive: patient.isActive,
      updatedAt: patient.updatedAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPatientById(tenantId: string, patientId: string) {
  return prisma.patient.findFirst({
    where: { id: patientId, tenantId },
    include: {
      registrationBranch: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function assertTenantOwnsPatient(tenantId: string, patientId: string) {
  const patient = await getPatientById(tenantId, patientId);
  if (!patient) {
    throw new Error("PATIENT_NOT_FOUND");
  }
  return patient;
}

export async function listRegistrationBranchOptions(tenantId: string) {
  return prisma.branch.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
}
