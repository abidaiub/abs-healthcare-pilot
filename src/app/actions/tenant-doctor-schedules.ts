"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { startOfDay } from "@/lib/appointment/constants";
import {
  MAX_SLOT_DURATION_MINUTES,
  MIN_SLOT_DURATION_MINUTES,
  generateShiftSlots,
  isValidTimeOfDay,
  timeToMinutes,
} from "@/lib/doctor-schedule/constants";
import { assertNoScheduleOverlap, assertDoctorUnchangedOnEdit } from "@/lib/doctor-schedule/concurrency";
import { DOCTOR_SCHEDULE_ERROR_CODES } from "@/lib/doctor-schedule/errors";
import {
  getDoctorDayAvailability,
  listDoctorSchedules,
  type DoctorDayAvailability,
} from "@/lib/doctor-schedule/queries";

export type DoctorScheduleActionResult =
  | { ok: true; scheduleId: string; stateVersion?: number }
  | { ok: false; errorCode: string };

export type DoctorScheduleInput = {
  scheduleId?: string;
  /** Required when updating an existing shift — compare-and-swap token. */
  expectedStateVersion?: number;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  chamber?: string | null;
};

function revalidateSchedulePaths() {
  revalidatePath("/settings/doctor-schedules");
  revalidatePath("/settings/doctors");
  revalidatePath("/appointments/new");
}

async function auditSchedule(input: {
  tenantId: string;
  branchId: string;
  userId: string;
  actorName: string;
  actionType: "INSERT" | "UPDATE";
  event: string;
  entityId: string;
  changeData: Record<string, unknown>;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    branchId: input.branchId,
    userId: input.userId,
    actionType: input.actionType,
    entityType: "DoctorSchedule",
    entityId: input.entityId,
    changeData: { event: input.event, ...input.changeData },
    createdBy: input.actorName,
  });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function listDoctorSchedulesAction(doctorId?: string) {
  const session = await requireTenantPermission("/settings/doctor-schedules");
  return listDoctorSchedules(session.tenantId, session.branchId ?? null, doctorId);
}

export async function getDoctorDayAvailabilityAction(input: {
  doctorId: string;
  appointmentDate: string;
  excludeAppointmentId?: string;
}): Promise<DoctorDayAvailability> {
  const session = await requireTenantPermission("/appointments");
  if (!session.branchId) return { hasPublishedSchedule: false, slots: [] };

  const parsed = new Date(input.appointmentDate);
  if (Number.isNaN(parsed.getTime())) return { hasPublishedSchedule: false, slots: [] };

  return getDoctorDayAvailability(
    session.tenantId,
    session.branchId,
    input.doctorId,
    parsed,
    input.excludeAppointmentId,
  );
}

/**
 * Creates or updates one weekly shift row. New rows are always saved as drafts; making a
 * shift bookable is a separate, separately audited publish step.
 * Overlap validation runs inside the same transaction as the write under an advisory lock.
 */
export async function saveDoctorScheduleAction(
  input: DoctorScheduleInput,
): Promise<DoctorScheduleActionResult> {
  await requireTenantPermission("/settings/doctor-schedules", "canEdit");
  const session = await requireTenantSession();

  if (!session.branchId) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_BRANCH_REQUIRED };
  }
  const branchId = session.branchId;

  if (!Number.isInteger(input.dayOfWeek) || input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_INVALID_DAY };
  }
  if (!isValidTimeOfDay(input.startTime) || !isValidTimeOfDay(input.endTime)) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_INVALID_TIME };
  }

  const start = timeToMinutes(input.startTime);
  const end = timeToMinutes(input.endTime);
  if (start === null || end === null || end <= start) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_INVALID_RANGE };
  }

  if (
    !Number.isInteger(input.slotDuration) ||
    input.slotDuration < MIN_SLOT_DURATION_MINUTES ||
    input.slotDuration > MAX_SLOT_DURATION_MINUTES ||
    input.slotDuration > end - start
  ) {
    return {
      ok: false,
      errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_INVALID_SLOT_DURATION,
    };
  }

  /** Persisted doctor for updates; requested doctor for creates. Never reassigned on edit. */
  let effectiveDoctorId: string;

  if (input.scheduleId) {
    if (
      input.expectedStateVersion === undefined ||
      !Number.isInteger(input.expectedStateVersion) ||
      input.expectedStateVersion < 1
    ) {
      return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_STALE };
    }

    const existing = await prisma.doctorSchedule.findFirst({
      where: { id: input.scheduleId, tenantId: session.tenantId },
      select: { id: true, branchId: true, doctorId: true },
    });
    if (!existing) {
      return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_NOT_FOUND };
    }
    if (existing.branchId !== branchId) {
      return {
        ok: false,
        errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_BRANCH_ACCESS_DENIED,
      };
    }
    const immutable = assertDoctorUnchangedOnEdit(existing.doctorId, input.doctorId);
    if (!immutable.ok) {
      return { ok: false, errorCode: immutable.errorCode };
    }
    effectiveDoctorId = existing.doctorId;
  } else {
    const doctor = await prisma.doctor.findFirst({
      where: { id: input.doctorId, tenantId: session.tenantId, isActive: true },
      select: { id: true },
    });
    if (!doctor) {
      return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DOCTOR_INVALID };
    }

    const doctorAtBranch = await prisma.doctorBranch.findFirst({
      where: { tenantId: session.tenantId, doctorId: doctor.id, branchId, isActive: true },
      select: { id: true },
    });
    if (!doctorAtBranch) {
      return {
        ok: false,
        errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DOCTOR_NOT_AT_BRANCH,
      };
    }
    effectiveDoctorId = doctor.id;
  }

  const chamber = input.chamber?.trim() || null;
  const data = {
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    slotDuration: input.slotDuration,
    chamber,
    updatedBy: session.user.name,
  };

  let schedule: { id: string; stateVersion: number };
  try {
    schedule = await prisma.$transaction(async (tx) => {
      const overlap = await assertNoScheduleOverlap(tx, {
        tenantId: session.tenantId,
        branchId,
        doctorId: effectiveDoctorId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        excludeScheduleId: input.scheduleId,
      });
      if (!overlap.ok) {
        throw new Error(overlap.errorCode);
      }

      if (input.scheduleId) {
        const updated = await tx.doctorSchedule.updateMany({
          where: {
            id: input.scheduleId,
            tenantId: session.tenantId,
            branchId,
            doctorId: effectiveDoctorId,
            stateVersion: input.expectedStateVersion,
          },
          data: {
            ...data,
            stateVersion: { increment: 1 },
          },
        });
        if (updated.count !== 1) {
          throw new Error(DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_STALE);
        }
        const row = await tx.doctorSchedule.findFirstOrThrow({
          where: { id: input.scheduleId, tenantId: session.tenantId },
          select: { id: true, stateVersion: true },
        });
        return row;
      }

      return tx.doctorSchedule.create({
        data: {
          ...data,
          tenantId: session.tenantId,
          branchId,
          doctorId: effectiveDoctorId,
          createdBy: session.user.name,
        },
        select: { id: true, stateVersion: true },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      const code = error.message;
      if (
        code === DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_OVERLAP ||
        code === DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DUPLICATE ||
        code === DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_STALE ||
        code === DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DOCTOR_IMMUTABLE
      ) {
        return { ok: false, errorCode: code };
      }
    }
    if (isUniqueViolation(error)) {
      return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DUPLICATE };
    }
    throw error;
  }

  await auditSchedule({
    tenantId: session.tenantId,
    branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: input.scheduleId ? "UPDATE" : "INSERT",
    event: input.scheduleId ? "DOCTOR_SCHEDULE_UPDATED" : "DOCTOR_SCHEDULE_CREATED",
    entityId: schedule.id,
    changeData: {
      doctorId: effectiveDoctorId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      slotDuration: input.slotDuration,
      chamber,
      stateVersion: schedule.stateVersion,
    },
  });

  revalidateSchedulePaths();
  return { ok: true, scheduleId: schedule.id, stateVersion: schedule.stateVersion };
}

export async function setDoctorSchedulePublishedAction(
  scheduleId: string,
  isPublished: boolean,
  expectedStateVersion: number,
): Promise<DoctorScheduleActionResult> {
  await requireTenantPermission("/settings/doctor-schedules", "canApprove");
  const session = await requireTenantSession();

  if (!Number.isInteger(expectedStateVersion) || expectedStateVersion < 1) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_STALE };
  }

  const schedule = await prisma.doctorSchedule.findFirst({
    where: { id: scheduleId, tenantId: session.tenantId },
    select: {
      id: true,
      branchId: true,
      doctorId: true,
      isActive: true,
      startTime: true,
      endTime: true,
      slotDuration: true,
    },
  });
  if (!schedule) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_NOT_FOUND };
  }
  if (session.branchId && schedule.branchId !== session.branchId) {
    return {
      ok: false,
      errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_BRANCH_ACCESS_DENIED,
    };
  }
  if (isPublished && !schedule.isActive) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_NOT_FOUND };
  }
  if (
    isPublished &&
    generateShiftSlots(schedule.startTime, schedule.endTime, schedule.slotDuration).length === 0
  ) {
    return {
      ok: false,
      errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_INVALID_SLOT_DURATION,
    };
  }

  const updated = await prisma.doctorSchedule.updateMany({
    where: {
      id: schedule.id,
      tenantId: session.tenantId,
      stateVersion: expectedStateVersion,
    },
    data: {
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      publishedBy: isPublished ? session.user.name : null,
      updatedBy: session.user.name,
      stateVersion: { increment: 1 },
    },
  });
  if (updated.count !== 1) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_STALE };
  }

  const fresh = await prisma.doctorSchedule.findFirstOrThrow({
    where: { id: schedule.id, tenantId: session.tenantId },
    select: { stateVersion: true },
  });

  await auditSchedule({
    tenantId: session.tenantId,
    branchId: schedule.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: isPublished ? "DOCTOR_SCHEDULE_PUBLISHED" : "DOCTOR_SCHEDULE_UNPUBLISHED",
    entityId: schedule.id,
    changeData: { doctorId: schedule.doctorId, stateVersion: fresh.stateVersion },
  });

  revalidateSchedulePaths();
  return { ok: true, scheduleId: schedule.id, stateVersion: fresh.stateVersion };
}

/**
 * Retires a shift. Blocked while future appointments still sit in its slots so that
 * already-booked patients never lose their schedule reference.
 */
export async function deactivateDoctorScheduleAction(
  scheduleId: string,
  expectedStateVersion: number,
): Promise<DoctorScheduleActionResult> {
  await requireTenantPermission("/settings/doctor-schedules", "canDelete");
  const session = await requireTenantSession();

  if (!Number.isInteger(expectedStateVersion) || expectedStateVersion < 1) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_STALE };
  }

  const schedule = await prisma.doctorSchedule.findFirst({
    where: { id: scheduleId, tenantId: session.tenantId },
    select: {
      id: true,
      branchId: true,
      doctorId: true,
      startTime: true,
      endTime: true,
      slotDuration: true,
    },
  });
  if (!schedule) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_NOT_FOUND };
  }
  if (session.branchId && schedule.branchId !== session.branchId) {
    return {
      ok: false,
      errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_BRANCH_ACCESS_DENIED,
    };
  }

  const slots = generateShiftSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);
  if (slots.length > 0) {
    const upcoming = await prisma.appointment.count({
      where: {
        tenantId: session.tenantId,
        branchId: schedule.branchId,
        doctorId: schedule.doctorId,
        appointmentDate: { gte: startOfDay(new Date()) },
        timeSlot: { in: slots },
        status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
      },
    });
    if (upcoming > 0) {
      return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_HAS_BOOKINGS };
    }
  }

  const updated = await prisma.doctorSchedule.updateMany({
    where: {
      id: schedule.id,
      tenantId: session.tenantId,
      stateVersion: expectedStateVersion,
    },
    data: {
      isActive: false,
      isPublished: false,
      publishedAt: null,
      publishedBy: null,
      updatedBy: session.user.name,
      stateVersion: { increment: 1 },
    },
  });
  if (updated.count !== 1) {
    return { ok: false, errorCode: DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_STALE };
  }

  const fresh = await prisma.doctorSchedule.findFirstOrThrow({
    where: { id: schedule.id, tenantId: session.tenantId },
    select: { stateVersion: true },
  });

  await auditSchedule({
    tenantId: session.tenantId,
    branchId: schedule.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "DOCTOR_SCHEDULE_DEACTIVATED",
    entityId: schedule.id,
    changeData: { doctorId: schedule.doctorId, stateVersion: fresh.stateVersion },
  });

  revalidateSchedulePaths();
  return { ok: true, scheduleId: schedule.id, stateVersion: fresh.stateVersion };
}
