import { prisma } from "@/lib/db";
import { DEFAULT_MAX_PATIENTS_PER_SLOT } from "@/lib/appointment/errors";
import { startOfDay } from "@/lib/appointment/constants";
import { dayOfWeekFromDate, generateShiftSlots } from "@/lib/doctor-schedule/constants";

export type DoctorScheduleRow = {
  id: string;
  branchId: string;
  branchName: string;
  doctorId: string;
  doctorCode: string;
  doctorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  chamber: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  isActive: boolean;
  stateVersion: number;
  slotCount: number;
};

export type AvailableSlot = {
  slot: string;
  booked: number;
  capacity: number;
  isFull: boolean;
};

export type DoctorDayAvailability = {
  /** False when the doctor has no published shift for this branch/day at all. */
  hasPublishedSchedule: boolean;
  slots: AvailableSlot[];
};

export type ScheduleDoctorOption = {
  id: string;
  doctorCode: string;
  doctorName: string;
  specialty: string | null;
};

/** Active doctors assigned to the given branch — the only doctors a shift may be created for. */
export async function listBranchDoctorOptions(
  tenantId: string,
  branchId: string,
): Promise<ScheduleDoctorOption[]> {
  const rows = await prisma.doctor.findMany({
    where: {
      tenantId,
      isActive: true,
      doctorBranches: { some: { branchId, isActive: true } },
    },
    select: { id: true, doctorCode: true, doctorName: true, specialty: true },
    orderBy: { doctorName: "asc" },
  });
  return rows;
}

export async function listDoctorSchedules(
  tenantId: string,
  branchId: string | null,
  doctorId?: string,
): Promise<DoctorScheduleRow[]> {
  const rows = await prisma.doctorSchedule.findMany({
    where: {
      tenantId,
      ...(branchId ? { branchId } : {}),
      ...(doctorId ? { doctorId } : {}),
    },
    include: {
      branch: { select: { name: true } },
      doctor: { select: { doctorCode: true, doctorName: true } },
    },
    orderBy: [{ doctorId: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    branchId: row.branchId,
    branchName: row.branch.name,
    doctorId: row.doctorId,
    doctorCode: row.doctor.doctorCode,
    doctorName: row.doctor.doctorName,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    slotDuration: row.slotDuration,
    chamber: row.chamber,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    isActive: row.isActive,
    stateVersion: row.stateVersion,
    slotCount: generateShiftSlots(row.startTime, row.endTime, row.slotDuration).length,
  }));
}

/**
 * Published shifts for one doctor/branch/weekday. Draft and deactivated shifts are
 * excluded so an unpublished schedule can never be booked against.
 */
export async function listPublishedShifts(
  tenantId: string,
  branchId: string,
  doctorId: string,
  dayOfWeek: number,
) {
  return prisma.doctorSchedule.findMany({
    where: {
      tenantId,
      branchId,
      doctorId,
      dayOfWeek,
      isPublished: true,
      isActive: true,
    },
    select: { startTime: true, endTime: true, slotDuration: true },
    orderBy: { startTime: "asc" },
  });
}

/**
 * Resolves the bookable slot list for a doctor on a specific date and annotates each slot
 * with its current booking count. `excludeAppointmentId` keeps an appointment being edited
 * from counting against its own slot.
 */
export async function getDoctorDayAvailability(
  tenantId: string,
  branchId: string,
  doctorId: string,
  date: Date,
  excludeAppointmentId?: string,
): Promise<DoctorDayAvailability> {
  const appointmentDate = startOfDay(date);
  const shifts = await listPublishedShifts(
    tenantId,
    branchId,
    doctorId,
    dayOfWeekFromDate(appointmentDate),
  );

  if (shifts.length === 0) {
    return { hasPublishedSchedule: false, slots: [] };
  }

  const slotSet = new Set<string>();
  for (const shift of shifts) {
    for (const slot of generateShiftSlots(shift.startTime, shift.endTime, shift.slotDuration)) {
      slotSet.add(slot);
    }
  }
  const slots = [...slotSet].sort();

  const grouped = await prisma.appointment.groupBy({
    by: ["timeSlot"],
    where: {
      tenantId,
      branchId,
      doctorId,
      appointmentDate,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      timeSlot: { in: slots },
      ...(excludeAppointmentId ? { NOT: { id: excludeAppointmentId } } : {}),
    },
    _count: { _all: true },
  });

  const bookedBySlot = new Map<string, number>();
  for (const row of grouped) {
    if (row.timeSlot) bookedBySlot.set(row.timeSlot, row._count._all);
  }

  return {
    hasPublishedSchedule: true,
    slots: slots.map((slot) => {
      const booked = bookedBySlot.get(slot) ?? 0;
      return {
        slot,
        booked,
        capacity: DEFAULT_MAX_PATIENTS_PER_SLOT,
        isFull: booked >= DEFAULT_MAX_PATIENTS_PER_SLOT,
      };
    }),
  };
}
