"use server";

import { revalidatePath } from "next/cache";
import type { AppointmentStatus, ClinicalEncounterStatus } from "@/generated/prisma/client";
import { canTransitionStatus } from "@/lib/appointment/constants";
import { prisma } from "@/lib/db";
import {
  APPOINTMENT_START_STATUSES,
  canTransitionEncounterStatus,
  isEncounterEditable,
  startOfDay,
} from "@/lib/consultation/constants";
import { ENCOUNTER_ERROR_CODES } from "@/lib/consultation/errors";
import { allocateEncounterNumber } from "@/lib/consultation/number";
import {
  assertTenantOwnsEncounter,
  findActiveEncounterForAppointment,
  getEncounterById,
  listConsultationWorklist,
  listEncounters,
  validateBranchAccess,
  validateDoctorAtBranch,
} from "@/lib/consultation/queries";
import {
  parseConsultationDraftFormData,
  parseDiagnosisFormData,
  parseInvestigationAdviceFormData,
  parseMedicineAdviceFormData,
  parseVitalsFormData,
  vitalsToDb,
} from "@/lib/consultation/validation";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";

export type ConsultationActionResult =
  | { ok: true; encounterId?: string; encounterNumber?: string }
  | { ok: false; errorCode: string };

async function auditEncounterEvent(input: {
  tenantId: string;
  branchId: string;
  userId: string;
  actorName: string;
  actionType: "INSERT" | "UPDATE";
  event: string;
  entityId: string;
  changeData?: Record<string, unknown>;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    branchId: input.branchId,
    userId: input.userId,
    actionType: input.actionType,
    entityType: "ClinicalEncounter",
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidateConsultationPaths(encounterId?: string) {
  revalidatePath("/consultations");
  revalidatePath("/doctor/worklist");
  revalidatePath("/appointments/queue/operator");
  if (encounterId) {
    revalidatePath(`/consultations/${encounterId}`);
    revalidatePath(`/consultations/${encounterId}/edit`);
    revalidatePath(`/consultations/${encounterId}/print`);
  }
}

async function assertEncounterEditable(
  tenantId: string,
  encounterId: string,
  permissionRoute: "/consultations/edit" | "/consultations/vitals",
) {
  await requireTenantPermission(permissionRoute, "canEdit");
  const encounter = await assertTenantOwnsEncounter(tenantId, encounterId);
  if (!isEncounterEditable(encounter.status)) {
    throw new Error(ENCOUNTER_ERROR_CODES.ENCOUNTER_NOT_EDITABLE);
  }
  return encounter;
}

async function transitionAppointmentForConsultation(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: {
    appointmentId: string;
    tenantId: string;
    nextStatus: AppointmentStatus;
    updatedBy: string;
  },
) {
  const appointment = await tx.appointment.findFirst({
    where: { id: input.appointmentId, tenantId: input.tenantId },
  });
  if (!appointment) return null;
  if (!canTransitionStatus(appointment.status, input.nextStatus)) {
    throw new Error(ENCOUNTER_ERROR_CODES.APPOINTMENT_INVALID_STATUS);
  }
  const now = new Date();
  return tx.appointment.update({
    where: { id: appointment.id },
    data: {
      status: input.nextStatus,
      updatedBy: input.updatedBy,
      calledAt: input.nextStatus === "CALLED" ? now : appointment.calledAt,
      completedAt: input.nextStatus === "COMPLETED" ? now : appointment.completedAt,
    },
  });
}

export async function startConsultationAction(
  appointmentId: string,
): Promise<ConsultationActionResult> {
  await requireTenantPermission("/consultations/start", "canCreate");
  const session = await requireTenantSession();

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId: session.tenantId },
    include: {
      patient: { select: { id: true, isActive: true } },
      branch: { select: { id: true, isActive: true } },
      doctor: { select: { id: true, departmentId: true, isActive: true } },
    },
  });

  if (!appointment) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.APPOINTMENT_NOT_FOUND };
  }
  if (!appointment.patient.isActive) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_PATIENT_INACTIVE };
  }
  if (!appointment.branch.isActive) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_BRANCH_INACTIVE };
  }
  if (!appointment.doctor.isActive) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_DOCTOR_INACTIVE };
  }

  const branchAccess = await validateBranchAccess(
    session.tenantId,
    appointment.branchId,
    session.userId,
  );
  if (!branchAccess) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_BRANCH_UNAUTHORIZED };
  }

  const doctorAtBranch = await validateDoctorAtBranch(
    session.tenantId,
    appointment.doctorId,
    appointment.branchId,
  );
  if (!doctorAtBranch) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_DOCTOR_BRANCH };
  }

  if (
    !APPOINTMENT_START_STATUSES.includes(
      appointment.status as (typeof APPOINTMENT_START_STATUSES)[number],
    )
  ) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.APPOINTMENT_NOT_READY };
  }

  const existing = await findActiveEncounterForAppointment(
    session.tenantId,
    appointment.id,
  );
  if (existing) {
    if (appointment.status !== "IN_CONSULTATION") {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "IN_CONSULTATION", updatedBy: session.user.name },
      });
    }
    revalidateConsultationPaths(existing.id);
    return {
      ok: true,
      encounterId: existing.id,
      encounterNumber: existing.encounterNumber,
    };
  }

  try {
    const encounter = await prisma.$transaction(async (tx) => {
      const encounterNumber = await allocateEncounterNumber(tx, session.tenantId);
      const now = new Date();
      const created = await tx.clinicalEncounter.create({
        data: {
          tenantId: session.tenantId,
          branchId: appointment.branchId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          departmentId: appointment.departmentId ?? appointment.doctor.departmentId,
          appointmentId: appointment.id,
          encounterNumber,
          status: "IN_PROGRESS",
          consultationDate: startOfDay(appointment.appointmentDate),
          startedAt: now,
          chiefComplaint: appointment.reasonForVisit,
          createdById: session.userId,
          createdBy: session.user.name,
          updatedById: session.userId,
          updatedBy: session.user.name,
        },
      });

      await transitionAppointmentForConsultation(tx, {
        appointmentId: appointment.id,
        tenantId: session.tenantId,
        nextStatus: "IN_CONSULTATION",
        updatedBy: session.user.name,
      });

      return created;
    });

    await auditEncounterEvent({
      tenantId: session.tenantId,
      branchId: appointment.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: "INSERT",
      event: "CONSULTATION_STARTED",
      entityId: encounter.id,
      changeData: {
        appointmentId: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
      },
    });

    revalidateConsultationPaths(encounter.id);
    return {
      ok: true,
      encounterId: encounter.id,
      encounterNumber: encounter.encounterNumber,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("clinical_encounters_active_appointment_uidx")
    ) {
      const resumed = await findActiveEncounterForAppointment(
        session.tenantId,
        appointment.id,
      );
      if (resumed) {
        return {
          ok: true,
          encounterId: resumed.id,
          encounterNumber: resumed.encounterNumber,
        };
      }
      return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_ALREADY_STARTED };
    }
    throw error;
  }
}

export async function saveConsultationDraftAction(
  encounterId: string,
  formData: FormData,
): Promise<ConsultationActionResult> {
  const session = await requireTenantSession();
  const parsed = parseConsultationDraftFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode ?? ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }

  const encounter = await assertEncounterEditable(
    session.tenantId,
    encounterId,
    "/consultations/edit",
  );

  await prisma.clinicalEncounter.update({
    where: { id: encounter.id },
    data: {
      ...parsed,
      status: encounter.status === "DRAFT" ? "IN_PROGRESS" : encounter.status,
      updatedById: session.userId,
      updatedBy: session.user.name,
    },
  });

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "CONSULTATION_DRAFT_SAVED",
    entityId: encounter.id,
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id, encounterNumber: encounter.encounterNumber };
}

export async function updateEncounterVitalsAction(
  encounterId: string,
  formData: FormData,
): Promise<ConsultationActionResult> {
  const session = await requireTenantSession();
  const parsed = parseVitalsFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode ?? ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }

  const encounter = await assertEncounterEditable(
    session.tenantId,
    encounterId,
    "/consultations/vitals",
  );

  const vitalData = vitalsToDb(parsed);
  await prisma.encounterVital.upsert({
    where: { encounterId: encounter.id },
    create: {
      tenantId: session.tenantId,
      encounterId: encounter.id,
      ...vitalData,
      capturedById: session.userId,
      capturedBy: session.user.name,
    },
    update: {
      ...vitalData,
      capturedAt: new Date(),
      capturedById: session.userId,
      capturedBy: session.user.name,
    },
  });

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "VITALS_RECORDED",
    entityId: encounter.id,
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function addEncounterDiagnosisAction(
  encounterId: string,
  formData: FormData,
): Promise<ConsultationActionResult> {
  const session = await requireTenantSession();
  const parsed = parseDiagnosisFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode ?? ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }

  const encounter = await assertEncounterEditable(
    session.tenantId,
    encounterId,
    "/consultations/edit",
  );

  const count = await prisma.encounterDiagnosis.count({
    where: { tenantId: session.tenantId, encounterId: encounter.id, isActive: true },
  });

  await prisma.encounterDiagnosis.create({
    data: {
      tenantId: session.tenantId,
      encounterId: encounter.id,
      ...parsed,
      sortOrder: count,
      createdBy: session.user.name,
      updatedBy: session.user.name,
    },
  });

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "DIAGNOSIS_ADDED",
    entityId: encounter.id,
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function removeEncounterDiagnosisAction(
  encounterId: string,
  diagnosisId: string,
): Promise<ConsultationActionResult> {
  const session = await requireTenantSession();
  const encounter = await assertEncounterEditable(
    session.tenantId,
    encounterId,
    "/consultations/edit",
  );

  await prisma.encounterDiagnosis.updateMany({
    where: {
      id: diagnosisId,
      tenantId: session.tenantId,
      encounterId: encounter.id,
      isActive: true,
    },
    data: { isActive: false, updatedBy: session.user.name },
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function addMedicineAdviceAction(
  encounterId: string,
  formData: FormData,
): Promise<ConsultationActionResult> {
  const session = await requireTenantSession();
  const parsed = parseMedicineAdviceFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode ?? ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }

  const encounter = await assertEncounterEditable(
    session.tenantId,
    encounterId,
    "/consultations/edit",
  );

  const count = await prisma.encounterMedicineAdvice.count({
    where: { tenantId: session.tenantId, encounterId: encounter.id, isActive: true },
  });

  await prisma.encounterMedicineAdvice.create({
    data: {
      tenantId: session.tenantId,
      encounterId: encounter.id,
      ...parsed,
      sortOrder: count,
      createdBy: session.user.name,
      updatedBy: session.user.name,
    },
  });

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "MEDICINE_ADVICE_ADDED",
    entityId: encounter.id,
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function removeMedicineAdviceAction(
  encounterId: string,
  medicineId: string,
): Promise<ConsultationActionResult> {
  const session = await requireTenantSession();
  const encounter = await assertEncounterEditable(
    session.tenantId,
    encounterId,
    "/consultations/edit",
  );

  await prisma.encounterMedicineAdvice.updateMany({
    where: {
      id: medicineId,
      tenantId: session.tenantId,
      encounterId: encounter.id,
      isActive: true,
    },
    data: { isActive: false, updatedBy: session.user.name },
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function addInvestigationAdviceAction(
  encounterId: string,
  formData: FormData,
): Promise<ConsultationActionResult> {
  const session = await requireTenantSession();
  const parsed = parseInvestigationAdviceFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode ?? ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }

  const encounter = await assertEncounterEditable(
    session.tenantId,
    encounterId,
    "/consultations/edit",
  );

  const count = await prisma.encounterInvestigationAdvice.count({
    where: { tenantId: session.tenantId, encounterId: encounter.id, isActive: true },
  });

  await prisma.encounterInvestigationAdvice.create({
    data: {
      tenantId: session.tenantId,
      encounterId: encounter.id,
      ...parsed,
      sortOrder: count,
      createdBy: session.user.name,
      updatedBy: session.user.name,
    },
  });

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "INVESTIGATION_ADVISED",
    entityId: encounter.id,
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function removeInvestigationAdviceAction(
  encounterId: string,
  investigationId: string,
): Promise<ConsultationActionResult> {
  const session = await requireTenantSession();
  const encounter = await assertEncounterEditable(
    session.tenantId,
    encounterId,
    "/consultations/edit",
  );

  await prisma.encounterInvestigationAdvice.updateMany({
    where: {
      id: investigationId,
      tenantId: session.tenantId,
      encounterId: encounter.id,
      isActive: true,
    },
    data: { isActive: false, updatedBy: session.user.name },
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function completeConsultationAction(
  encounterId: string,
): Promise<ConsultationActionResult> {
  await requireTenantPermission("/consultations/complete", "canEdit");
  const session = await requireTenantSession();
  const encounter = await assertTenantOwnsEncounter(session.tenantId, encounterId);

  if (!canTransitionEncounterStatus(encounter.status, "COMPLETED")) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_STATUS_INVALID };
  }

  const completed = await prisma.$transaction(async (tx) => {
    const row = await tx.clinicalEncounter.update({
      where: { id: encounter.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        updatedById: session.userId,
        updatedBy: session.user.name,
      },
    });

    if (encounter.appointmentId) {
      await transitionAppointmentForConsultation(tx, {
        appointmentId: encounter.appointmentId,
        tenantId: session.tenantId,
        nextStatus: "COMPLETED",
        updatedBy: session.user.name,
      });
    }

    return row;
  });

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "CONSULTATION_COMPLETED",
    entityId: completed.id,
  });

  revalidateConsultationPaths(completed.id);
  return {
    ok: true,
    encounterId: completed.id,
    encounterNumber: completed.encounterNumber,
  };
}

export async function cancelConsultationAction(
  encounterId: string,
): Promise<ConsultationActionResult> {
  await requireTenantPermission("/consultations/edit", "canEdit");
  const session = await requireTenantSession();
  const encounter = await assertTenantOwnsEncounter(session.tenantId, encounterId);

  if (!canTransitionEncounterStatus(encounter.status, "CANCELLED")) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_STATUS_INVALID };
  }

  await prisma.clinicalEncounter.update({
    where: { id: encounter.id },
    data: {
      status: "CANCELLED",
      updatedById: session.userId,
      updatedBy: session.user.name,
    },
  });

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "CONSULTATION_CANCELLED",
    entityId: encounter.id,
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function reopenConsultationAction(
  encounterId: string,
  reason: string,
): Promise<ConsultationActionResult> {
  await requireTenantPermission("/consultations/reopen", "canApprove");
  const session = await requireTenantSession();
  const encounter = await assertTenantOwnsEncounter(session.tenantId, encounterId);

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.REOPEN_REASON_REQUIRED };
  }

  if (!canTransitionEncounterStatus(encounter.status, "IN_PROGRESS", true)) {
    return { ok: false, errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_STATUS_INVALID };
  }

  await prisma.clinicalEncounter.update({
    where: { id: encounter.id },
    data: {
      status: "IN_PROGRESS",
      completedAt: null,
      reopenReason: trimmedReason.slice(0, 1000),
      reopenedAt: new Date(),
      reopenedById: session.userId,
      correctionReason: trimmedReason.slice(0, 1000),
      updatedById: session.userId,
      updatedBy: session.user.name,
    },
  });

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "CONSULTATION_REOPENED",
    entityId: encounter.id,
    changeData: { reasonProvided: true },
  });

  revalidateConsultationPaths(encounter.id);
  return { ok: true, encounterId: encounter.id };
}

export async function recordConsultationPrintedAction(
  encounterId: string,
): Promise<ConsultationActionResult> {
  await requireTenantPermission("/consultations/print", "canPrint");
  const session = await requireTenantSession();
  const encounter = await assertTenantOwnsEncounter(session.tenantId, encounterId);

  await auditEncounterEvent({
    tenantId: session.tenantId,
    branchId: encounter.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "CONSULTATION_PRINTED",
    entityId: encounter.id,
  });

  return { ok: true, encounterId: encounter.id };
}

export async function listConsultationWorklistAction(filters?: {
  branchId?: string;
  doctorId?: string;
}) {
  await requireTenantPermission("/consultations", "canView");
  const session = await requireTenantSession();
  return listConsultationWorklist(session.tenantId, filters ?? {});
}

export async function listEncountersAction(filters?: {
  patientId?: string;
  branchId?: string;
  doctorId?: string;
}) {
  await requireTenantPermission("/consultations", "canView");
  const session = await requireTenantSession();
  return listEncounters(session.tenantId, filters ?? {});
}

export async function getEncounterAction(encounterId: string) {
  await requireTenantPermission("/consultations", "canView");
  const session = await requireTenantSession();
  return getEncounterById(session.tenantId, encounterId);
}
