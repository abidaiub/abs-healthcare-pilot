"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canTransitionPrescriptionStatus, isPrescriptionEditable } from "@/lib/prescription/constants";
import { PRESCRIPTION_ERROR_CODES } from "@/lib/prescription/errors";
import { allocatePrescriptionNumber } from "@/lib/prescription/number";
import {
  assertTenantOwnsPrescription,
  findCurrentDraftForEncounter,
  findCurrentPrescriptionForEncounter,
  getPrescriptionById,
  listPrescriptionVersions,
  listPrescriptions,
  prescriptionInclude,
  validateEncounterForPrescription,
} from "@/lib/prescription/queries";
import {
  prescriptionHasClinicalContent,
  replacePrescriptionSnapshotFromEncounter,
} from "@/lib/prescription/snapshot";
import {
  detectDuplicateMedicineWarning,
  parseDraftUpdateFormData,
  parseMedicineFormData,
} from "@/lib/prescription/validation";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";

export type PrescriptionActionResult =
  | { ok: true; prescriptionId?: string; prescriptionNumber?: string; versionNumber?: number; duplicateWarning?: boolean }
  | { ok: false; errorCode: string };

async function auditPrescriptionEvent(input: {
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
    entityType: "Prescription",
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidatePrescriptionPaths(prescriptionId?: string, prescriptionNumber?: string) {
  revalidatePath("/prescriptions");
  if (prescriptionId) {
    revalidatePath(`/prescriptions/${prescriptionId}`);
    revalidatePath(`/prescriptions/${prescriptionId}/edit`);
    revalidatePath(`/prescriptions/${prescriptionId}/print`);
    revalidatePath(`/prescriptions/${prescriptionId}/history`);
  }
  if (prescriptionNumber) {
    revalidatePath(`/prescriptions/history/${prescriptionNumber}`);
  }
}

async function assertDraftEditable(tenantId: string, prescriptionId: string) {
  await requireTenantPermission("/prescriptions/edit", "canEdit");
  const prescription = await assertTenantOwnsPrescription(tenantId, prescriptionId);
  if (!isPrescriptionEditable(prescription.status)) {
    throw new Error(PRESCRIPTION_ERROR_CODES.PRESCRIPTION_NOT_EDITABLE);
  }
  return prescription;
}

export async function createPrescriptionDraftAction(
  encounterId: string,
): Promise<PrescriptionActionResult> {
  await requireTenantPermission("/prescriptions/new", "canCreate");
  const session = await requireTenantSession();

  const validation = await validateEncounterForPrescription(
    session.tenantId,
    encounterId,
    session.userId,
  );
  if (!validation.ok) return validation;

  const existingDraft = await findCurrentDraftForEncounter(session.tenantId, encounterId);
  if (existingDraft) {
    return {
      ok: true,
      prescriptionId: existingDraft.id,
      prescriptionNumber: existingDraft.prescriptionNumber,
      versionNumber: existingDraft.versionNumber,
    };
  }

  const currentFinalized = await prisma.prescription.findFirst({
    where: {
      tenantId: session.tenantId,
      encounterId,
      status: "FINALIZED",
      isCurrentVersion: true,
    },
  });
  if (currentFinalized) {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_CURRENT_VERSION_EXISTS };
  }

  try {
    const prescription = await prisma.$transaction(async (tx) => {
      const prescriptionNumber = await allocatePrescriptionNumber(tx, session.tenantId);
      const created = await tx.prescription.create({
        data: {
          tenantId: session.tenantId,
          branchId: validation.encounter.branchId,
          patientId: validation.encounter.patientId,
          doctorId: validation.encounter.doctorId,
          encounterId: validation.encounter.id,
          appointmentId: validation.encounter.appointmentId,
          departmentId: validation.encounter.departmentId,
          prescriptionNumber,
          status: "DRAFT",
          versionNumber: 1,
          isCurrentVersion: true,
          createdById: session.userId,
          createdBy: session.user.name,
          updatedById: session.userId,
          updatedBy: session.user.name,
        },
      });

      await replacePrescriptionSnapshotFromEncounter(
        tx,
        created.id,
        session.tenantId,
        validation.encounter,
      );

      return created;
    });

    await auditPrescriptionEvent({
      tenantId: session.tenantId,
      branchId: prescription.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: "INSERT",
      event: "PRESCRIPTION_DRAFT_CREATED",
      entityId: prescription.id,
      changeData: { encounterId, versionNumber: 1 },
    });

    revalidatePrescriptionPaths(prescription.id, prescription.prescriptionNumber);
    revalidatePath(`/consultations/${encounterId}`);
    return {
      ok: true,
      prescriptionId: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      versionNumber: prescription.versionNumber,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("prescriptions_draft_encounter_uidx")) {
      const resumed = await findCurrentDraftForEncounter(session.tenantId, encounterId);
      if (resumed) {
        return {
          ok: true,
          prescriptionId: resumed.id,
          prescriptionNumber: resumed.prescriptionNumber,
          versionNumber: resumed.versionNumber,
        };
      }
    }
    throw error;
  }
}

export async function syncPrescriptionFromEncounterAction(
  prescriptionId: string,
): Promise<PrescriptionActionResult> {
  const session = await requireTenantSession();
  const prescription = await assertDraftEditable(session.tenantId, prescriptionId);

  const encounter = await prisma.clinicalEncounter.findFirst({
    where: { id: prescription.encounterId, tenantId: session.tenantId, isActive: true },
    include: {
      diagnoses: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      medicines: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      investigations: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!encounter || encounter.status === "CANCELLED") {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_ENCOUNTER_INVALID };
  }

  await prisma.$transaction(async (tx) => {
    await replacePrescriptionSnapshotFromEncounter(
      tx,
      prescription.id,
      session.tenantId,
      encounter,
    );
    await tx.prescription.update({
      where: { id: prescription.id },
      data: { updatedById: session.userId, updatedBy: session.user.name },
    });
  });

  await auditPrescriptionEvent({
    tenantId: session.tenantId,
    branchId: prescription.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "PRESCRIPTION_SYNCED_FROM_ENCOUNTER",
    entityId: prescription.id,
  });

  revalidatePrescriptionPaths(prescription.id);
  return { ok: true, prescriptionId: prescription.id };
}

export async function updatePrescriptionDraftAction(
  prescriptionId: string,
  formData: FormData,
): Promise<PrescriptionActionResult> {
  const session = await requireTenantSession();
  const parsed = parseDraftUpdateFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode ?? PRESCRIPTION_ERROR_CODES.PRESCRIPTION_VALIDATION };
  }

  const prescription = await assertDraftEditable(session.tenantId, prescriptionId);
  await prisma.prescription.update({
    where: { id: prescription.id },
    data: {
      ...parsed,
      updatedById: session.userId,
      updatedBy: session.user.name,
    },
  });

  await auditPrescriptionEvent({
    tenantId: session.tenantId,
    branchId: prescription.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "PRESCRIPTION_DRAFT_UPDATED",
    entityId: prescription.id,
  });

  revalidatePrescriptionPaths(prescription.id);
  return { ok: true, prescriptionId: prescription.id };
}

export async function addPrescriptionMedicineAction(
  prescriptionId: string,
  formData: FormData,
): Promise<PrescriptionActionResult> {
  const session = await requireTenantSession();
  const parsed = parseMedicineFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode ?? PRESCRIPTION_ERROR_CODES.PRESCRIPTION_MEDICINE_INVALID };
  }

  const prescription = await assertDraftEditable(session.tenantId, prescriptionId);
  const existing = await prisma.prescriptionMedicine.findMany({
    where: { prescriptionId: prescription.id, tenantId: session.tenantId, isActive: true },
    select: { medicineName: true, strength: true, dose: true, sequence: true },
  });
  const duplicateWarning = detectDuplicateMedicineWarning(existing, parsed);
  const nextSequence =
    existing.reduce((max, row) => Math.max(max, row.sequence), -1) + 1;

  await prisma.prescriptionMedicine.create({
    data: {
      tenantId: session.tenantId,
      prescriptionId: prescription.id,
      ...parsed,
      sequence: nextSequence,
    },
  });

  revalidatePrescriptionPaths(prescription.id);
  return { ok: true, prescriptionId: prescription.id, duplicateWarning };
}

export async function removePrescriptionMedicineAction(
  prescriptionId: string,
  medicineId: string,
): Promise<PrescriptionActionResult> {
  const session = await requireTenantSession();
  const prescription = await assertDraftEditable(session.tenantId, prescriptionId);
  await prisma.prescriptionMedicine.updateMany({
    where: {
      id: medicineId,
      prescriptionId: prescription.id,
      tenantId: session.tenantId,
      isActive: true,
    },
    data: { isActive: false },
  });
  revalidatePrescriptionPaths(prescription.id);
  return { ok: true, prescriptionId: prescription.id };
}

export async function finalizePrescriptionAction(
  prescriptionId: string,
): Promise<PrescriptionActionResult> {
  await requireTenantPermission("/prescriptions/finalize", "canEdit");
  const session = await requireTenantSession();
  const prescription = await assertTenantOwnsPrescription(session.tenantId, prescriptionId);

  if (prescription.status === "FINALIZED") {
    return {
      ok: true,
      prescriptionId: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      versionNumber: prescription.versionNumber,
    };
  }
  if (!canTransitionPrescriptionStatus(prescription.status, "FINALIZED")) {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_INVALID_STATUS };
  }

  const hasContent = await prescriptionHasClinicalContent(
    prisma,
    prescription.id,
    session.tenantId,
  );
  if (!hasContent) {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_EMPTY };
  }

  const finalized = await prisma.$transaction(async (tx) => {
    const previous = prescription.supersedesPrescriptionId
      ? await tx.prescription.findFirst({
          where: { id: prescription.supersedesPrescriptionId, tenantId: session.tenantId },
        })
      : null;

    const row = await tx.prescription.update({
      where: { id: prescription.id },
      data: {
        status: "FINALIZED",
        finalizedAt: new Date(),
        updatedById: session.userId,
        updatedBy: session.user.name,
      },
    });

    if (previous && previous.status === "FINALIZED") {
      await tx.prescription.update({
        where: { id: previous.id },
        data: { status: "SUPERSEDED", isCurrentVersion: false },
      });
    }

    return row;
  });

  await auditPrescriptionEvent({
    tenantId: session.tenantId,
    branchId: prescription.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "PRESCRIPTION_FINALIZED",
    entityId: finalized.id,
    changeData: { versionNumber: finalized.versionNumber },
  });

  revalidatePrescriptionPaths(finalized.id, finalized.prescriptionNumber);
  revalidatePath(`/consultations/${prescription.encounterId}`);
  return {
    ok: true,
    prescriptionId: finalized.id,
    prescriptionNumber: finalized.prescriptionNumber,
    versionNumber: finalized.versionNumber,
  };
}

export async function cancelPrescriptionAction(
  prescriptionId: string,
  reason: string,
): Promise<PrescriptionActionResult> {
  await requireTenantPermission("/prescriptions/cancel", "canEdit");
  const session = await requireTenantSession();
  const prescription = await assertTenantOwnsPrescription(session.tenantId, prescriptionId);
  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_CANCELLATION_REASON_REQUIRED };
  }
  if (!canTransitionPrescriptionStatus(prescription.status, "CANCELLED")) {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_INVALID_STATUS };
  }

  await prisma.prescription.update({
    where: { id: prescription.id },
    data: {
      status: "CANCELLED",
      isCurrentVersion: false,
      cancelledAt: new Date(),
      cancellationReason: trimmed.slice(0, 1000),
      updatedById: session.userId,
      updatedBy: session.user.name,
    },
  });

  await auditPrescriptionEvent({
    tenantId: session.tenantId,
    branchId: prescription.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "PRESCRIPTION_CANCELLED",
    entityId: prescription.id,
    changeData: { reasonProvided: true },
  });

  revalidatePrescriptionPaths(prescription.id, prescription.prescriptionNumber);
  return { ok: true, prescriptionId: prescription.id };
}

export async function createPrescriptionRevisionAction(
  prescriptionId: string,
  reason: string,
): Promise<PrescriptionActionResult> {
  await requireTenantPermission("/prescriptions/revise", "canApprove");
  const session = await requireTenantSession();
  const source = await assertTenantOwnsPrescription(session.tenantId, prescriptionId);
  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_REVISION_REASON_REQUIRED };
  }
  if (source.status !== "FINALIZED" || !source.isCurrentVersion) {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_INVALID_STATUS };
  }

  const existingDraft = await findCurrentDraftForEncounter(session.tenantId, source.encounterId);
  if (existingDraft) {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_DRAFT_EXISTS };
  }

  const revision = await prisma.$transaction(async (tx) => {
    await tx.prescription.update({
      where: { id: source.id },
      data: { isCurrentVersion: false },
    });

    const created = await tx.prescription.create({
      data: {
        tenantId: source.tenantId,
        branchId: source.branchId,
        patientId: source.patientId,
        doctorId: source.doctorId,
        encounterId: source.encounterId,
        appointmentId: source.appointmentId,
        departmentId: source.departmentId,
        prescriptionNumber: source.prescriptionNumber,
        status: "DRAFT",
        versionNumber: source.versionNumber + 1,
        isCurrentVersion: true,
        supersedesPrescriptionId: source.id,
        revisionReason: trimmed.slice(0, 1000),
        generalAdvice: source.generalAdvice,
        followUpDate: source.followUpDate,
        followUpIntervalDays: source.followUpIntervalDays,
        followUpInstructions: source.followUpInstructions,
        clinicalSummary: source.clinicalSummary,
        createdById: session.userId,
        createdBy: session.user.name,
        updatedById: session.userId,
        updatedBy: session.user.name,
      },
    });

    const [medicines, diagnoses, investigations] = await Promise.all([
      tx.prescriptionMedicine.findMany({ where: { prescriptionId: source.id, isActive: true } }),
      tx.prescriptionDiagnosis.findMany({ where: { prescriptionId: source.id, isActive: true } }),
      tx.prescriptionInvestigation.findMany({ where: { prescriptionId: source.id, isActive: true } }),
    ]);

    if (diagnoses.length) {
      await tx.prescriptionDiagnosis.createMany({
        data: diagnoses.map((row) => ({
          tenantId: session.tenantId,
          prescriptionId: created.id,
          sourceEncounterDiagnosisId: row.sourceEncounterDiagnosisId,
          diagnosisType: row.diagnosisType,
          diagnosisText: row.diagnosisText,
          icdCode: row.icdCode,
          notes: row.notes,
          sequence: row.sequence,
        })),
      });
    }
    if (medicines.length) {
      await tx.prescriptionMedicine.createMany({
        data: medicines.map((row) => ({
          tenantId: session.tenantId,
          prescriptionId: created.id,
          sourceEncounterMedicineAdviceId: row.sourceEncounterMedicineAdviceId,
          medicineName: row.medicineName,
          genericName: row.genericName,
          strength: row.strength,
          dose: row.dose,
          route: row.route,
          frequency: row.frequency,
          durationValue: row.durationValue,
          durationUnit: row.durationUnit,
          durationText: row.durationText,
          quantity: row.quantity,
          foodTiming: row.foodTiming,
          instructions: row.instructions,
          sequence: row.sequence,
        })),
      });
    }
    if (investigations.length) {
      await tx.prescriptionInvestigation.createMany({
        data: investigations.map((row) => ({
          tenantId: session.tenantId,
          prescriptionId: created.id,
          sourceEncounterInvestigationId: row.sourceEncounterInvestigationId,
          investigationText: row.investigationText,
          priority: row.priority,
          instructions: row.instructions,
          clinicalNote: row.clinicalNote,
          status: row.status,
          sequence: row.sequence,
        })),
      });
    }

    return created;
  });

  await auditPrescriptionEvent({
    tenantId: session.tenantId,
    branchId: source.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "PRESCRIPTION_REVISION_CREATED",
    entityId: revision.id,
    changeData: {
      supersedesPrescriptionId: source.id,
      versionNumber: revision.versionNumber,
      reasonProvided: true,
    },
  });

  revalidatePrescriptionPaths(revision.id, revision.prescriptionNumber);
  return {
    ok: true,
    prescriptionId: revision.id,
    prescriptionNumber: revision.prescriptionNumber,
    versionNumber: revision.versionNumber,
  };
}

export async function printPrescriptionAction(
  prescriptionId: string,
  reprint = false,
): Promise<PrescriptionActionResult> {
  await requireTenantPermission("/prescriptions/print", "canPrint");
  const session = await requireTenantSession();
  const prescription = await assertTenantOwnsPrescription(session.tenantId, prescriptionId);
  if (prescription.status !== "FINALIZED") {
    return { ok: false, errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_PRINT_DENIED };
  }

  await auditPrescriptionEvent({
    tenantId: session.tenantId,
    branchId: prescription.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: reprint ? "PRESCRIPTION_REPRINTED" : "PRESCRIPTION_PRINTED",
    entityId: prescription.id,
    changeData: { versionNumber: prescription.versionNumber },
  });

  return { ok: true, prescriptionId: prescription.id };
}

export async function getPrescriptionAction(prescriptionId: string) {
  await requireTenantPermission("/prescriptions", "canView");
  const session = await requireTenantSession();
  return getPrescriptionById(session.tenantId, prescriptionId);
}

export async function listPrescriptionsAction(filters?: {
  patientId?: string;
  branchId?: string;
  doctorId?: string;
}) {
  await requireTenantPermission("/prescriptions", "canView");
  const session = await requireTenantSession();
  return listPrescriptions(session.tenantId, { ...filters, currentOnly: false });
}

export async function listPrescriptionHistoryAction(prescriptionNumber: string) {
  await requireTenantPermission("/prescriptions/history", "canView");
  const session = await requireTenantSession();
  return listPrescriptionVersions(session.tenantId, prescriptionNumber);
}

export async function findCurrentPrescriptionForEncounterAction(encounterId: string) {
  await requireTenantPermission("/prescriptions", "canView");
  const session = await requireTenantSession();
  return findCurrentPrescriptionForEncounter(session.tenantId, encounterId);
}
