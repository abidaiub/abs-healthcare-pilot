import type { PrismaClient } from "../../src/generated/prisma/client";
import { buildFullName, normalizeMobile, normalizeNationalId } from "../../src/lib/patient/normalize";

const SEED_MARKER = "MOD-15 seed";

type PatientSeed = {
  patientNumber: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  dateOfBirth?: Date;
  estimatedAge?: number;
  ageAsOfDate?: Date;
  mobile?: string;
  nationalId?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianMobile?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactMobile?: string;
  isActive?: boolean;
  branchCode: string;
};

const ABMG_PATIENTS: PatientSeed[] = [
  {
    patientNumber: "PT-000001",
    firstName: "Rahim",
    lastName: "Karim",
    gender: "MALE",
    dateOfBirth: new Date("1988-04-12"),
    mobile: "+880 1711111001",
    nationalId: "8804123456789",
    branchCode: "BR-HO-01",
  },
  {
    patientNumber: "PT-000002",
    firstName: "Ayesha",
    lastName: "Begum",
    gender: "FEMALE",
    estimatedAge: 8,
    ageAsOfDate: new Date("2026-07-24"),
    guardianName: "Karim Uddin",
    guardianRelation: "Father",
    guardianMobile: "+880 1711111002",
    branchCode: "BR-MIR-02",
  },
  {
    patientNumber: "PT-000003",
    firstName: "Nusrat",
    gender: "FEMALE",
    estimatedAge: 45,
    ageAsOfDate: new Date("2026-07-24"),
    emergencyContactName: "Sadia Rahman",
    emergencyContactRelation: "Sister",
    emergencyContactMobile: "+880 1711111003",
    branchCode: "BR-HO-01",
  },
  {
    patientNumber: "PT-000004",
    firstName: "Jamal",
    lastName: "Hossain",
    gender: "MALE",
    dateOfBirth: new Date("1975-11-03"),
    branchCode: "BR-MIR-02",
  },
  {
    patientNumber: "PT-000005",
    firstName: "Samira",
    lastName: "Akter",
    gender: "FEMALE",
    dateOfBirth: new Date("1992-08-19"),
    mobile: "01711111005",
    branchCode: "BR-HO-01",
  },
  {
    patientNumber: "PT-000006",
    firstName: "Farid",
    lastName: "Chowdhury",
    gender: "MALE",
    dateOfBirth: new Date("1960-01-20"),
    mobile: "+880 1711111006",
    isActive: false,
    branchCode: "BR-HO-01",
  },
];

async function syncPatientCounter(prisma: PrismaClient, tenantId: string) {
  const latest = await prisma.patient.findFirst({
    where: { tenantId },
    orderBy: { patientNumber: "desc" },
    select: { patientNumber: true },
  });

  const lastNumber = latest?.patientNumber
    ? Number.parseInt(latest.patientNumber.replace(/^PT-0*/, ""), 10)
    : 0;

  await prisma.tenantPatientCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: Number.isNaN(lastNumber) ? 0 : lastNumber },
    update: { lastNumber: Number.isNaN(lastNumber) ? 0 : lastNumber },
  });
}

export async function seedPatientFoundation(prisma: PrismaClient, tenantId: string) {
  for (const seed of ABMG_PATIENTS) {
    const existing = await prisma.patient.findUnique({
      where: {
        tenantId_patientNumber: {
          tenantId,
          patientNumber: seed.patientNumber,
        },
      },
    });

    if (existing) continue;

    const branch = await prisma.branch.findFirst({
      where: { tenantId, code: seed.branchCode, isActive: true },
      select: { id: true },
    });
    if (!branch) continue;

    const mobileNormalized = seed.mobile ? normalizeMobile(seed.mobile) : null;
    const guardianMobileNormalized = seed.guardianMobile
      ? normalizeMobile(seed.guardianMobile)
      : null;
    const emergencyContactMobileNormalized = seed.emergencyContactMobile
      ? normalizeMobile(seed.emergencyContactMobile)
      : null;

    await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: seed.patientNumber,
        firstName: seed.firstName,
        middleName: seed.middleName ?? null,
        lastName: seed.lastName ?? null,
        fullName: buildFullName(seed.firstName, seed.middleName ?? null, seed.lastName ?? null),
        gender: seed.gender,
        dateOfBirth: seed.dateOfBirth ?? null,
        estimatedAge: seed.estimatedAge ?? null,
        ageAsOfDate: seed.ageAsOfDate ?? null,
        mobile: seed.mobile ?? null,
        mobileNormalized,
        nationalId: seed.nationalId ?? null,
        nationalIdNormalized: seed.nationalId ? normalizeNationalId(seed.nationalId) : null,
        guardianName: seed.guardianName ?? null,
        guardianRelation: seed.guardianRelation ?? null,
        guardianMobile: seed.guardianMobile ?? null,
        guardianMobileNormalized,
        emergencyContactName: seed.emergencyContactName ?? null,
        emergencyContactRelation: seed.emergencyContactRelation ?? null,
        emergencyContactMobile: seed.emergencyContactMobile ?? null,
        emergencyContactMobileNormalized,
        registrationBranchId: branch.id,
        isActive: seed.isActive ?? true,
        createdBy: SEED_MARKER,
        updatedBy: SEED_MARKER,
      },
    });
  }

  await syncPatientCounter(prisma, tenantId);
}
