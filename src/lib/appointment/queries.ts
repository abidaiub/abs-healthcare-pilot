import type { AppointmentStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { QUEUE_ACTIVE_STATUSES, startOfDay } from "@/lib/appointment/constants";

export type AppointmentListFilters = {
  search?: string;
  status?: AppointmentStatus | "all";
  doctorId?: string | "all";
  branchId?: string | "all";
  appointmentDate?: string;
  page?: number;
  pageSize?: number;
};

export type AppointmentListRow = {
  id: string;
  appointmentNumber: string;
  appointmentType: string;
  status: AppointmentStatus;
  appointmentDate: Date;
  timeSlot: string | null;
  queueToken: number | null;
  patientId: string;
  patientNumber: string;
  patientName: string;
  doctorId: string;
  doctorCode: string;
  doctorName: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  departmentName: string | null;
  updatedAt: Date;
};

function appointmentWhere(
  tenantId: string,
  filters: AppointmentListFilters,
): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = { tenantId };

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.doctorId && filters.doctorId !== "all") {
    where.doctorId = filters.doctorId;
  }
  if (filters.branchId && filters.branchId !== "all") {
    where.branchId = filters.branchId;
  }
  if (filters.appointmentDate) {
    const parsed = startOfDay(new Date(filters.appointmentDate));
    if (!Number.isNaN(parsed.getTime())) {
      where.appointmentDate = parsed;
    }
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { appointmentNumber: { contains: q, mode: "insensitive" } },
      { patient: { patientNumber: { contains: q, mode: "insensitive" } } },
      { patient: { fullName: { contains: q, mode: "insensitive" } } },
      { patient: { mobile: { contains: q, mode: "insensitive" } } },
      { patient: { mobileNormalized: { contains: q.replace(/\D/g, ""), mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function listAppointments(tenantId: string, filters: AppointmentListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const where = appointmentWhere(tenantId, filters);

  const [total, rows] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: [{ appointmentDate: "desc" }, { timeSlot: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        patient: { select: { id: true, patientNumber: true, fullName: true } },
        doctor: { select: { id: true, doctorCode: true, doctorName: true } },
        branch: { select: { id: true, code: true, name: true } },
        department: { select: { name: true } },
      },
    }),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      appointmentNumber: row.appointmentNumber,
      appointmentType: row.appointmentType,
      status: row.status,
      appointmentDate: row.appointmentDate,
      timeSlot: row.timeSlot,
      queueToken: row.queueToken,
      patientId: row.patient.id,
      patientNumber: row.patient.patientNumber,
      patientName: row.patient.fullName,
      doctorId: row.doctor.id,
      doctorCode: row.doctor.doctorCode,
      doctorName: row.doctor.doctorName,
      branchId: row.branch.id,
      branchCode: row.branch.code,
      branchName: row.branch.name,
      departmentName: row.department?.name ?? null,
      updatedAt: row.updatedAt,
    })) satisfies AppointmentListRow[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAppointmentById(tenantId: string, appointmentId: string) {
  return prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          fullName: true,
          mobile: true,
          isActive: true,
        },
      },
      doctor: { select: { id: true, doctorCode: true, doctorName: true, specialty: true } },
      branch: { select: { id: true, code: true, name: true } },
      department: { select: { id: true, name: true, deptCode: true } },
    },
  });
}

export async function assertTenantOwnsAppointment(tenantId: string, appointmentId: string) {
  const appointment = await getAppointmentById(tenantId, appointmentId);
  if (!appointment) {
    throw new Error("APPOINTMENT_NOT_FOUND");
  }
  return appointment;
}

export async function listAppointmentDoctorOptions(tenantId: string, branchId: string) {
  return prisma.doctor.findMany({
    where: {
      tenantId,
      isActive: true,
      doctorBranches: { some: { branchId, isActive: true } },
    },
    orderBy: { doctorName: "asc" },
    select: {
      id: true,
      doctorCode: true,
      doctorName: true,
      specialty: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
  });
}

export async function listAppointmentBranchOptions(tenantId: string) {
  return prisma.branch.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export async function searchPatientsForAppointment(tenantId: string, query: string, limit = 8) {
  const q = query.trim();
  if (!q) return [];

  return prisma.patient.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { patientNumber: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q, mode: "insensitive" } },
        { mobileNormalized: { contains: q.replace(/\D/g, ""), mode: "insensitive" } },
      ],
    },
    orderBy: { fullName: "asc" },
    take: limit,
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
      mobile: true,
    },
  });
}

export type QueueSummary = {
  waitingCount: number;
  calledCount: number;
  inConsultationCount: number;
  nextToken: number | null;
  currentToken: number | null;
};

export async function getQueueSummary(
  tenantId: string,
  branchId: string,
  doctorId: string,
  queueDate: Date,
): Promise<QueueSummary> {
  const date = startOfDay(queueDate);
  const baseWhere = {
    tenantId,
    branchId,
    doctorId,
    queueTokenDate: date,
    status: { in: QUEUE_ACTIVE_STATUSES },
  };

  const [waitingCount, calledCount, inConsultationCount, nextWaiting, currentCalled] =
    await Promise.all([
      prisma.appointment.count({ where: { ...baseWhere, status: "WAITING" } }),
      prisma.appointment.count({ where: { ...baseWhere, status: "CALLED" } }),
      prisma.appointment.count({ where: { ...baseWhere, status: "IN_CONSULTATION" } }),
      prisma.appointment.findFirst({
        where: { ...baseWhere, status: "WAITING" },
        orderBy: [{ queueToken: "asc" }],
        select: { queueToken: true },
      }),
      prisma.appointment.findFirst({
        where: { ...baseWhere, status: { in: ["CALLED", "IN_CONSULTATION"] } },
        orderBy: [{ calledAt: "desc" }],
        select: { queueToken: true },
      }),
    ]);

  return {
    waitingCount,
    calledCount,
    inConsultationCount,
    nextToken: nextWaiting?.queueToken ?? null,
    currentToken: currentCalled?.queueToken ?? null,
  };
}

export async function listQueueAppointments(
  tenantId: string,
  branchId: string,
  doctorId: string,
  queueDate: Date,
) {
  const date = startOfDay(queueDate);
  return prisma.appointment.findMany({
    where: {
      tenantId,
      branchId,
      doctorId,
      queueTokenDate: date,
      status: { in: QUEUE_ACTIVE_STATUSES },
    },
    orderBy: [{ queueToken: "asc" }, { checkedInAt: "asc" }],
    include: {
      patient: { select: { patientNumber: true, fullName: true, mobile: true } },
      doctor: { select: { doctorCode: true, doctorName: true } },
    },
  });
}

export async function getBookedSlots(
  tenantId: string,
  branchId: string,
  doctorId: string,
  appointmentDate: Date,
) {
  const rows = await prisma.appointment.findMany({
    where: {
      tenantId,
      branchId,
      doctorId,
      appointmentDate: startOfDay(appointmentDate),
      appointmentType: "SCHEDULED",
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      timeSlot: { not: null },
    },
    select: { timeSlot: true },
  });
  return new Set(rows.map((row) => row.timeSlot!).filter(Boolean));
}
