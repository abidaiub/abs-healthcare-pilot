"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { resolveRegistrationBranch } from "@/lib/patient/context";
import {
  findPatientDuplicates,
  hasCriticalDuplicate,
  type DuplicateMatch,
} from "@/lib/patient/duplicates";
import { PATIENT_ERROR_CODES } from "@/lib/patient/errors";
import { allocatePatientNumber } from "@/lib/patient/number";
import {
  assertTenantOwnsPatient,
  getPatientById,
  listPatients,
  type PatientListFilters,
} from "@/lib/patient/queries";
import {
  parsePatientFormData,
  patientDataFromInput,
  type PatientFormInput,
} from "@/lib/patient/validation";
import { requireTenantSession } from "@/lib/auth";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";

export type PatientActionResult =
  | { ok: true; patientId?: string; patientNumber?: string; duplicates?: DuplicateMatch[] }
  | { ok: false; errorCode: string; duplicates?: DuplicateMatch[] };

async function auditPatientEvent(input: {
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
    entityType: "Patient",
    entityId: input.entityId,
    changeData: { event: input.event, ...input.changeData },
    createdBy: input.actorName,
  });
}

function revalidatePatientPaths(patientId?: string) {
  revalidatePath("/patients");
  if (patientId) {
    revalidatePath(`/patients/${patientId}`);
    revalidatePath(`/patients/${patientId}/edit`);
  }
}

async function validateDuplicatesForSave(
  tenantId: string,
  userId: string,
  input: PatientFormInput,
  excludePatientId?: string,
): Promise<PatientActionResult | null> {
  const duplicates = await findPatientDuplicates(tenantId, input, excludePatientId);
  if (duplicates.length === 0) return null;

  if (hasCriticalDuplicate(duplicates)) {
    const canOverride = await hasTenantPermission(
      tenantId,
      userId,
      "/patients/new",
      "canApprove",
    );
    if (!input.overrideDuplicateWarning || !canOverride) {
      return {
        ok: false,
        errorCode: PATIENT_ERROR_CODES.PATIENT_NATIONAL_ID_DUPLICATE,
        duplicates,
      };
    }
  } else if (!input.overrideDuplicateWarning) {
    return {
      ok: false,
      errorCode: PATIENT_ERROR_CODES.PATIENT_DUPLICATE_WARNING,
      duplicates,
    };
  }

  return null;
}

export async function checkPatientDuplicatesAction(
  formData: FormData,
  excludePatientId?: string,
): Promise<{ ok: true; duplicates: DuplicateMatch[] } | { ok: false; errorCode: string }> {
  const session = await requireTenantPermission("/patients/new", "canCreate");
  const parsed = parsePatientFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode };
  }

  const duplicates = await findPatientDuplicates(session.tenantId, parsed, excludePatientId);

  await auditPatientEvent({
    tenantId: session.tenantId,
    branchId: session.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "PATIENT_DUPLICATE_WARNING_SHOWN",
    entityId: excludePatientId ?? "new",
    changeData: { matchCount: duplicates.length },
  });

  return { ok: true, duplicates };
}

export async function createPatientAction(formData: FormData): Promise<PatientActionResult> {
  const session = await requireTenantPermission("/patients/new", "canCreate");
  const parsed = parsePatientFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode };
  }

  const branchResult = await resolveRegistrationBranch(session);
  if (!branchResult.ok) {
    return { ok: false, errorCode: branchResult.errorCode };
  }

  const duplicateBlock = await validateDuplicatesForSave(
    session.tenantId,
    session.userId,
    parsed,
  );
  if (duplicateBlock) return duplicateBlock;

  const patient = await prisma.$transaction(async (tx) => {
    const patientNumber = await allocatePatientNumber(tx, session.tenantId);
    return tx.patient.create({
      data: {
        tenantId: session.tenantId,
        patientNumber,
        registrationBranchId: branchResult.branch.id,
        ...patientDataFromInput(parsed),
        createdBy: session.user.name,
        updatedBy: session.user.name,
      },
    });
  });

  await auditPatientEvent({
    tenantId: session.tenantId,
    branchId: branchResult.branch.id,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: parsed.overrideDuplicateWarning
      ? "PATIENT_DUPLICATE_WARNING_OVERRIDDEN"
      : "PATIENT_CREATED",
    entityId: patient.id,
    changeData: {
      patientNumber: patient.patientNumber,
      fullName: patient.fullName,
    },
  });

  revalidatePatientPaths(patient.id);
  return { ok: true, patientId: patient.id, patientNumber: patient.patientNumber };
}

export async function updatePatientAction(
  patientId: string,
  formData: FormData,
): Promise<PatientActionResult> {
  const session = await requireTenantPermission("/patients/new", "canEdit");
  const existing = await assertTenantOwnsPatient(session.tenantId, patientId);
  const parsed = parsePatientFormData(formData);
  if ("errorCode" in parsed) {
    return { ok: false, errorCode: parsed.errorCode };
  }

  const duplicateBlock = await validateDuplicatesForSave(
    session.tenantId,
    session.userId,
    parsed,
    patientId,
  );
  if (duplicateBlock) return duplicateBlock;

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      ...patientDataFromInput(parsed),
      updatedBy: session.user.name,
    },
  });

  await auditPatientEvent({
    tenantId: session.tenantId,
    branchId: existing.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "PATIENT_UPDATED",
    entityId: patient.id,
    changeData: {
      oldValue: existing.fullName,
      newValue: patient.fullName,
    },
  });

  revalidatePatientPaths(patient.id);
  return { ok: true, patientId: patient.id, patientNumber: patient.patientNumber };
}

export async function activatePatientAction(patientId: string): Promise<PatientActionResult> {
  const session = await requireTenantPermission("/patients/new", "canEdit");
  const existing = await assertTenantOwnsPatient(session.tenantId, patientId);

  if (existing.isActive) {
    return { ok: true, patientId, patientNumber: existing.patientNumber };
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { isActive: true, updatedBy: session.user.name },
  });

  await auditPatientEvent({
    tenantId: session.tenantId,
    branchId: existing.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "PATIENT_ACTIVATED",
    entityId: patient.id,
    changeData: { oldValue: "inactive", newValue: "active" },
  });

  revalidatePatientPaths(patient.id);
  return { ok: true, patientId: patient.id, patientNumber: patient.patientNumber };
}

export async function deactivatePatientAction(patientId: string): Promise<PatientActionResult> {
  const session = await requireTenantPermission("/patients/new", "canEdit");
  const existing = await assertTenantOwnsPatient(session.tenantId, patientId);

  if (!existing.isActive) {
    return { ok: true, patientId, patientNumber: existing.patientNumber };
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { isActive: false, updatedBy: session.user.name },
  });

  await auditPatientEvent({
    tenantId: session.tenantId,
    branchId: existing.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "PATIENT_DEACTIVATED",
    entityId: patient.id,
    changeData: { oldValue: "active", newValue: "inactive" },
  });

  revalidatePatientPaths(patient.id);
  return { ok: true, patientId: patient.id, patientNumber: patient.patientNumber };
}

export async function getPatientAction(patientId: string) {
  const session = await requireTenantPermission("/patients");
  return getPatientById(session.tenantId, patientId);
}

export async function listPatientsAction(filters: PatientListFilters) {
  const session = await requireTenantPermission("/patients");
  return listPatients(session.tenantId, filters);
}

export async function assertPatientAccess(patientId: string) {
  const session = await requireTenantSession();
  const patient = await getPatientById(session.tenantId, patientId);
  if (!patient) {
    return null;
  }
  const allowed = await hasTenantPermission(session.tenantId, session.userId, "/patients");
  if (!allowed) {
    return null;
  }
  return patient;
}
