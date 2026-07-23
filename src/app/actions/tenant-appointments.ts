"use server";

import { revalidatePath } from "next/cache";
import type { AppointmentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canTransitionStatus, startOfDay } from "@/lib/appointment/constants";
import { resolveAppointmentBranch } from "@/lib/appointment/context";
import { APPOINTMENT_ERROR_CODES } from "@/lib/appointment/errors";
import { allocateAppointmentNumber } from "@/lib/appointment/number";
import {
  assertTenantOwnsAppointment,
  getAppointmentById,
  listAppointments,
  searchPatientsForAppointment,
  type AppointmentListFilters,
} from "@/lib/appointment/queries";
import { allocateQueueToken, requeueToEnd } from "@/lib/appointment/queue";
import {
  appointmentDataFromInput,
  parseAppointmentFormData,
  validateAppointmentReferences,
} from "@/lib/appointment/validation";
import { requireTenantSession } from "@/lib/auth";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";

export type AppointmentActionResult =
  | { ok: true; appointmentId?: string; appointmentNumber?: string; queueToken?: number | null }
  | { ok: false; errorCode: string };

async function auditAppointmentEvent(input: {
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
    entityType: "Appointment",
    entityId: input.entityId,
    changeData: { event: input.event, ...input.changeData },
    createdBy: input.actorName,
  });
}

function revalidateAppointmentPaths(appointmentId?: string) {
  revalidatePath("/appointments");
  revalidatePath("/appointments/queue");
  revalidatePath("/appointments/queue/operator");
  if (appointmentId) {
    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath(`/appointments/${appointmentId}/edit`);
  }
}

async function transitionAppointment(
  appointmentId: string,
  nextStatus: AppointmentStatus,
  event: string,
  extra?: Record<string, unknown>,
): Promise<AppointmentActionResult> {
  const session = await requireTenantSession();
  const existing = await assertTenantOwnsAppointment(session.tenantId, appointmentId);

  if (!canTransitionStatus(existing.status, nextStatus)) {
    return { ok: false, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_STATUS };
  }

  const now = new Date();
  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: nextStatus,
      updatedBy: session.user.name,
      checkedInAt:
        nextStatus === "CHECKED_IN" || nextStatus === "WAITING"
          ? (existing.checkedInAt ?? now)
          : existing.checkedInAt,
      calledAt: nextStatus === "CALLED" ? now : existing.calledAt,
      completedAt: nextStatus === "COMPLETED" ? now : existing.completedAt,
      cancelledAt:
        nextStatus === "CANCELLED" || nextStatus === "NO_SHOW"
          ? now
          : existing.cancelledAt,
    },
  });

  await auditAppointmentEvent({
    tenantId: session.tenantId,
    branchId: existing.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event,
    entityId: appointment.id,
    changeData: {
      oldValue: existing.status,
      newValue: nextStatus,
      ...extra,
    },
  });

  revalidateAppointmentPaths(appointment.id);
  return {
    ok: true,
    appointmentId: appointment.id,
    appointmentNumber: appointment.appointmentNumber,
    queueToken: appointment.queueToken,
  };
}

export async function createAppointmentAction(
  formData: FormData,
): Promise<AppointmentActionResult> {
  const session = await requireTenantPermission("/appointments/new", "canCreate");
  const parsed = parseAppointmentFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode };
  }

  const branchResult = await resolveAppointmentBranch(session);
  if (!branchResult.ok) {
    return { ok: false, errorCode: branchResult.errorCode };
  }

  const refs = await validateAppointmentReferences(
    session.tenantId,
    branchResult.branch.id,
    parsed,
  );
  if (!refs.ok) {
    return { ok: false, errorCode: refs.errorCode };
  }

  const initialStatus = parsed.autoCheckIn ? ("WAITING" as const) : ("SCHEDULED" as const);

  const appointment = await prisma.$transaction(async (tx) => {
    const appointmentNumber = await allocateAppointmentNumber(tx, session.tenantId);
    let queueToken: number | null = null;
    let queueTokenDate: Date | null = null;

    if (parsed.autoCheckIn) {
      queueTokenDate = startOfDay(parsed.appointmentDate);
      queueToken = await allocateQueueToken(tx, {
        tenantId: session.tenantId,
        branchId: branchResult.branch.id,
        doctorId: parsed.doctorId,
        queueDate: queueTokenDate,
      });
    }

    return tx.appointment.create({
      data: {
        tenantId: session.tenantId,
        appointmentNumber,
        ...appointmentDataFromInput(
          parsed,
          branchResult.branch.id,
          refs.departmentId,
          initialStatus,
          queueToken,
          queueTokenDate,
        ),
        createdBy: session.user.name,
        updatedBy: session.user.name,
      },
    });
  });

  await auditAppointmentEvent({
    tenantId: session.tenantId,
    branchId: branchResult.branch.id,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "APPOINTMENT_CREATED",
    entityId: appointment.id,
    changeData: {
      appointmentNumber: appointment.appointmentNumber,
      appointmentType: appointment.appointmentType,
      queueToken: appointment.queueToken,
    },
  });

  revalidateAppointmentPaths(appointment.id);
  return {
    ok: true,
    appointmentId: appointment.id,
    appointmentNumber: appointment.appointmentNumber,
    queueToken: appointment.queueToken,
  };
}

export async function updateAppointmentAction(
  appointmentId: string,
  formData: FormData,
): Promise<AppointmentActionResult> {
  const session = await requireTenantPermission("/appointments/new", "canEdit");
  const existing = await assertTenantOwnsAppointment(session.tenantId, appointmentId);

  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)) {
    return { ok: false, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_STATUS };
  }

  const parsed = parseAppointmentFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode };
  }

  const refs = await validateAppointmentReferences(
    session.tenantId,
    existing.branchId,
    parsed,
    appointmentId,
  );
  if (!refs.ok) {
    return { ok: false, errorCode: refs.errorCode };
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      appointmentType: parsed.appointmentType,
      appointmentDate: parsed.appointmentDate,
      timeSlot: parsed.timeSlot,
      patientId: parsed.patientId,
      doctorId: parsed.doctorId,
      departmentId: refs.departmentId,
      reasonForVisit: parsed.reasonForVisit,
      notes: parsed.notes,
      updatedBy: session.user.name,
    },
  });

  await auditAppointmentEvent({
    tenantId: session.tenantId,
    branchId: existing.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "APPOINTMENT_UPDATED",
    entityId: appointment.id,
    changeData: { appointmentNumber: appointment.appointmentNumber },
  });

  revalidateAppointmentPaths(appointment.id);
  return {
    ok: true,
    appointmentId: appointment.id,
    appointmentNumber: appointment.appointmentNumber,
  };
}

export async function checkInAppointmentAction(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  await requireTenantPermission("/appointments/queue", "canEdit");
  const session = await requireTenantSession();
  const existing = await assertTenantOwnsAppointment(session.tenantId, appointmentId);

  if (!["SCHEDULED", "CHECKED_IN"].includes(existing.status)) {
    return { ok: false, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_STATUS };
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const queueTokenDate = startOfDay(existing.appointmentDate);
    const queueToken =
      existing.queueToken ??
      (await allocateQueueToken(tx, {
        tenantId: session.tenantId,
        branchId: existing.branchId,
        doctorId: existing.doctorId,
        queueDate: queueTokenDate,
      }));

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "WAITING",
        queueToken,
        queueTokenDate,
        checkedInAt: new Date(),
        updatedBy: session.user.name,
      },
    });
  });

  await auditAppointmentEvent({
    tenantId: session.tenantId,
    branchId: existing.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "APPOINTMENT_CHECKED_IN",
    entityId: appointment.id,
    changeData: { queueToken: appointment.queueToken },
  });

  revalidateAppointmentPaths(appointment.id);
  return {
    ok: true,
    appointmentId: appointment.id,
    appointmentNumber: appointment.appointmentNumber,
    queueToken: appointment.queueToken,
  };
}

export async function callQueueAppointmentAction(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  await requireTenantPermission("/appointments/queue/operator", "canEdit");
  return transitionAppointment(appointmentId, "CALLED", "QUEUE_CALLED");
}

export async function startConsultationAction(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  await requireTenantPermission("/appointments/queue/operator", "canEdit");
  return transitionAppointment(appointmentId, "IN_CONSULTATION", "APPOINTMENT_IN_CONSULTATION");
}

export async function completeAppointmentAction(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  await requireTenantPermission("/appointments/queue/operator", "canEdit");
  return transitionAppointment(appointmentId, "COMPLETED", "APPOINTMENT_COMPLETED");
}

export async function cancelAppointmentAction(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  await requireTenantPermission("/appointments/new", "canEdit");
  return transitionAppointment(appointmentId, "CANCELLED", "APPOINTMENT_CANCELLED");
}

export async function markNoShowAppointmentAction(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  await requireTenantPermission("/appointments/new", "canEdit");
  return transitionAppointment(appointmentId, "NO_SHOW", "APPOINTMENT_NO_SHOW");
}

export async function skipQueueAppointmentAction(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  await requireTenantPermission("/appointments/queue/operator", "canEdit");
  const session = await requireTenantSession();
  const existing = await assertTenantOwnsAppointment(session.tenantId, appointmentId);

  if (existing.status !== "WAITING" && existing.status !== "CALLED") {
    return { ok: false, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_STATUS };
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const queueTokenDate = startOfDay(existing.queueTokenDate ?? existing.appointmentDate);
    const newToken = await requeueToEnd(tx, {
      tenantId: session.tenantId,
      branchId: existing.branchId,
      doctorId: existing.doctorId,
      queueDate: queueTokenDate,
    });

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "WAITING",
        queueToken: newToken,
        queueTokenDate,
        calledAt: null,
        updatedBy: session.user.name,
      },
    });
  });

  await auditAppointmentEvent({
    tenantId: session.tenantId,
    branchId: existing.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "QUEUE_SKIPPED",
    entityId: appointment.id,
    changeData: {
      oldToken: existing.queueToken,
      newToken: appointment.queueToken,
    },
  });

  revalidateAppointmentPaths(appointment.id);
  return {
    ok: true,
    appointmentId: appointment.id,
    appointmentNumber: appointment.appointmentNumber,
    queueToken: appointment.queueToken,
  };
}

export async function recallQueueAppointmentAction(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  await requireTenantPermission("/appointments/queue/operator", "canEdit");
  const session = await requireTenantSession();
  const existing = await assertTenantOwnsAppointment(session.tenantId, appointmentId);

  if (!["CALLED", "IN_CONSULTATION", "WAITING"].includes(existing.status)) {
    return { ok: false, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_STATUS };
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CALLED",
      calledAt: new Date(),
      updatedBy: session.user.name,
    },
  });

  await auditAppointmentEvent({
    tenantId: session.tenantId,
    branchId: existing.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "QUEUE_RECALLED",
    entityId: appointment.id,
    changeData: { queueToken: appointment.queueToken },
  });

  revalidateAppointmentPaths(appointment.id);
  return {
    ok: true,
    appointmentId: appointment.id,
    appointmentNumber: appointment.appointmentNumber,
    queueToken: appointment.queueToken,
  };
}

export async function getAppointmentAction(appointmentId: string) {
  const session = await requireTenantPermission("/appointments");
  return getAppointmentById(session.tenantId, appointmentId);
}

export async function listAppointmentsAction(filters: AppointmentListFilters) {
  const session = await requireTenantPermission("/appointments");
  return listAppointments(session.tenantId, filters);
}

export async function searchPatientsForAppointmentAction(query: string) {
  const session = await requireTenantPermission("/appointments/new", "canCreate");
  return searchPatientsForAppointment(session.tenantId, query);
}

export async function assertAppointmentAccess(appointmentId: string) {
  const session = await requireTenantSession();
  const appointment = await getAppointmentById(session.tenantId, appointmentId);
  if (!appointment) return null;
  const allowed = await hasTenantPermission(session.tenantId, session.userId, "/appointments");
  if (!allowed) return null;
  return appointment;
}
