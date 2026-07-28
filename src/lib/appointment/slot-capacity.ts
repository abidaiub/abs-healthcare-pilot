import type { Prisma } from "@/generated/prisma/client";
import { TIME_SLOTS, startOfDay } from "@/lib/appointment/constants";
import {
  APPOINTMENT_ERROR_CODES,
  DEFAULT_MAX_PATIENTS_PER_SLOT,
} from "@/lib/appointment/errors";
import { dayOfWeekFromDate, generateShiftSlots } from "@/lib/doctor-schedule/constants";

/**
 * Serializes concurrent bookings for one doctor/branch/date/slot within a transaction.
 * Uses a transaction-scoped advisory lock so empty slots (no rows to FOR UPDATE) still
 * cannot double-book under DEFAULT_MAX_PATIENTS_PER_SLOT.
 */
export async function lockAppointmentSlot(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    branchId: string;
    doctorId: string;
    appointmentDate: Date;
    timeSlot: string;
  },
) {
  const dateKey = startOfDay(input.appointmentDate).toISOString().slice(0, 10);
  const keyA = `${input.tenantId}|${input.branchId}|${input.doctorId}`;
  const keyB = `${dateKey}|${input.timeSlot}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${keyA}), hashtext(${keyB}))`;
}

/**
 * Atomically validates slot membership and capacity. Must run inside the same transaction
 * as the appointment create/update that consumes the slot.
 */
export async function assertScheduledSlotAvailable(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    branchId: string;
    doctorId: string;
    appointmentDate: Date;
    timeSlot: string;
    excludeAppointmentId?: string;
  },
): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const appointmentDate = startOfDay(input.appointmentDate);

  await lockAppointmentSlot(tx, {
    tenantId: input.tenantId,
    branchId: input.branchId,
    doctorId: input.doctorId,
    appointmentDate,
    timeSlot: input.timeSlot,
  });

  const shifts = await tx.doctorSchedule.findMany({
    where: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      doctorId: input.doctorId,
      dayOfWeek: dayOfWeekFromDate(appointmentDate),
      isPublished: true,
      isActive: true,
    },
    select: { startTime: true, endTime: true, slotDuration: true },
  });

  if (shifts.length > 0) {
    const slotSet = new Set<string>();
    for (const shift of shifts) {
      for (const slot of generateShiftSlots(shift.startTime, shift.endTime, shift.slotDuration)) {
        slotSet.add(slot);
      }
    }
    if (!slotSet.has(input.timeSlot)) {
      return {
        ok: false,
        errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_SLOT_UNAVAILABLE,
      };
    }
  } else if (!TIME_SLOTS.includes(input.timeSlot as (typeof TIME_SLOTS)[number])) {
    return {
      ok: false,
      errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_SLOT_UNAVAILABLE,
    };
  }

  const booked = await tx.appointment.count({
    where: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      doctorId: input.doctorId,
      appointmentDate,
      timeSlot: input.timeSlot,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(input.excludeAppointmentId ? { NOT: { id: input.excludeAppointmentId } } : {}),
    },
  });

  if (booked >= DEFAULT_MAX_PATIENTS_PER_SLOT) {
    return { ok: false, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_SLOT_FULL };
  }

  return { ok: true };
}
