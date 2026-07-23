import type { PrismaClient } from "../../src/generated/prisma/client";
import { startOfDay } from "../../src/lib/appointment/constants";

const SEED_MARKER = "MOD-17 seed";

const OPD_DEPARTMENTS = [
  { deptCode: "OPD-MED", name: "General Medicine", deptType: "OPD" },
  { deptCode: "OPD-CARD", name: "Cardiology", deptType: "OPD" },
] as const;

const OPD_DOCTORS = [
  {
    doctorCode: "DR-OPD-001",
    doctorName: "Dr. Amina Rahman",
    specialty: "General Medicine",
    deptCode: "OPD-MED",
    branchCode: "BR-HO-01",
    consultationFee: 500,
  },
  {
    doctorCode: "DR-OPD-002",
    doctorName: "Dr. Karim Chowdhury",
    specialty: "Cardiology",
    deptCode: "OPD-CARD",
    branchCode: "BR-MIR-02",
    consultationFee: 800,
  },
] as const;

export async function seedAppointmentFoundation(prisma: PrismaClient, tenantId: string) {
  const departments = new Map<string, string>();
  for (const dept of OPD_DEPARTMENTS) {
    const row = await prisma.department.upsert({
      where: { tenantId_deptCode: { tenantId, deptCode: dept.deptCode } },
      update: { name: dept.name, deptType: dept.deptType, isActive: true },
      create: {
        tenantId,
        deptCode: dept.deptCode,
        name: dept.name,
        deptType: dept.deptType,
        createdBy: SEED_MARKER,
        updatedBy: SEED_MARKER,
      },
    });
    departments.set(dept.deptCode, row.id);
  }

  for (const doctorSeed of OPD_DOCTORS) {
    const branch = await prisma.branch.findFirst({
      where: { tenantId, code: doctorSeed.branchCode, isActive: true },
    });
    if (!branch) continue;

    const doctor = await prisma.doctor.upsert({
      where: { tenantId_doctorCode: { tenantId, doctorCode: doctorSeed.doctorCode } },
      update: {
        doctorName: doctorSeed.doctorName,
        specialty: doctorSeed.specialty,
        departmentId: departments.get(doctorSeed.deptCode) ?? null,
        consultationFee: doctorSeed.consultationFee,
        isConsultant: true,
        isActive: true,
      },
      create: {
        tenantId,
        doctorCode: doctorSeed.doctorCode,
        doctorName: doctorSeed.doctorName,
        specialty: doctorSeed.specialty,
        departmentId: departments.get(doctorSeed.deptCode) ?? null,
        consultationFee: doctorSeed.consultationFee,
        isConsultant: true,
        isActive: true,
        createdBy: SEED_MARKER,
        updatedBy: SEED_MARKER,
      },
    });

    await prisma.doctorBranch.upsert({
      where: {
        tenantId_doctorId_branchId: {
          tenantId,
          doctorId: doctor.id,
          branchId: branch.id,
        },
      },
      update: { isActive: true, isPrimary: true },
      create: {
        tenantId,
        doctorId: doctor.id,
        branchId: branch.id,
        isPrimary: true,
        isActive: true,
        createdBy: SEED_MARKER,
        updatedBy: SEED_MARKER,
      },
    });
  }

  const patient = await prisma.patient.findFirst({
    where: { tenantId, patientNumber: "PT-000001", isActive: true },
  });
  const doctor = await prisma.doctor.findFirst({
    where: { tenantId, doctorCode: "DR-OPD-001", isActive: true },
  });
  const branch = await prisma.branch.findFirst({
    where: { tenantId, code: "BR-HO-01", isActive: true },
  });

  if (!patient || !doctor || !branch) return;

  const existing = await prisma.appointment.findUnique({
    where: { tenantId_appointmentNumber: { tenantId, appointmentNumber: "AP-000001" } },
  });
  if (existing) return;

  const today = startOfDay(new Date());
  await prisma.appointment.create({
    data: {
      tenantId,
      appointmentNumber: "AP-000001",
      appointmentType: "SCHEDULED",
      status: "SCHEDULED",
      appointmentDate: today,
      timeSlot: "10:00",
      patientId: patient.id,
      branchId: branch.id,
      doctorId: doctor.id,
      departmentId: doctor.departmentId,
      reasonForVisit: "General consultation",
      createdBy: SEED_MARKER,
      updatedBy: SEED_MARKER,
    },
  });

  await prisma.tenantAppointmentCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: 1 },
  });
}
