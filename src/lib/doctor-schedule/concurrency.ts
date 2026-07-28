import type { Prisma } from "@/generated/prisma/client";
import { shiftsOverlap } from "@/lib/doctor-schedule/constants";
import { DOCTOR_SCHEDULE_ERROR_CODES } from "@/lib/doctor-schedule/errors";

/**
 * Schedules are permanently bound to the doctor chosen at creation.
 * Reassignment must be done by retiring the old row and creating a new one.
 */
export function assertDoctorUnchangedOnEdit(
  existingDoctorId: string,
  requestedDoctorId: string,
): { ok: true } | { ok: false; errorCode: string } {
  if (existingDoctorId !== requestedDoctorId) {
    return {
      ok: false,
      errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DOCTOR_IMMUTABLE,
    };
  }
  return { ok: true };
}

/**
 * Serializes concurrent create/update for one doctor/branch/weekday so overlap checks
 * cannot both observe a clear calendar.
 */
export async function lockDoctorDaySchedules(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    branchId: string;
    doctorId: string;
    dayOfWeek: number;
  },
) {
  const keyA = `${input.tenantId}|${input.branchId}|${input.doctorId}`;
  const keyB = `dow:${input.dayOfWeek}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${keyA}), hashtext(${keyB}))`;
}

export async function assertNoScheduleOverlap(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    branchId: string;
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    excludeScheduleId?: string;
  },
): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  await lockDoctorDaySchedules(tx, input);

  const sameDayShifts = await tx.doctorSchedule.findMany({
    where: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      doctorId: input.doctorId,
      dayOfWeek: input.dayOfWeek,
      isActive: true,
      ...(input.excludeScheduleId ? { NOT: { id: input.excludeScheduleId } } : {}),
    },
    select: { id: true, startTime: true, endTime: true },
  });

  if (sameDayShifts.some((shift) => shift.startTime === input.startTime)) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DUPLICATE };
  }
  if (sameDayShifts.some((shift) => shiftsOverlap(shift, input))) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_OVERLAP };
  }

  return { ok: true };
}
