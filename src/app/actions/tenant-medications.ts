"use server";

import { revalidatePath } from "next/cache";
import type { MedicationCatalogStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { MEDICATION_ERROR_CODES } from "@/lib/medication/errors";
import { allocateMedicationCode } from "@/lib/medication/number";
import {
  assertTenantOwnsMedication,
  buildMedicationDisplayName,
  listMedications,
  medicationCatalogInclude,
  medicationReferencedByPrescription,
  searchPrescriptionMedications,
} from "@/lib/medication/queries";
import {
  buildDisplayStrength,
  canApplyMedicationStatusTransition,
  normalizeDuplicateKey,
  parseGenericFormData,
  parseManufacturerFormData,
  parseMedicationFormData,
  parseMedicationImportCsv,
  type MedicationFormInput,
} from "@/lib/medication/validation";
import { normalizeMedicationText } from "@/lib/medication/normalize";

export type MedicationActionResult =
  | { ok: true; medicationId?: string; internalCode?: string; rowsApplied?: number }
  | { ok: false; errorCode: string };

async function auditMedicationEvent(input: {
  tenantId: string;
  userId: string;
  actorName: string;
  actionType: "INSERT" | "UPDATE";
  event: string;
  entityId: string;
  changeData?: Record<string, unknown>;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    userId: input.userId,
    actionType: input.actionType,
    entityType: "MedicationCatalogItem",
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidateMedicationPaths(medicationId?: string) {
  revalidatePath("/pharmacy/medications");
  if (medicationId) {
    revalidatePath(`/pharmacy/medications/${medicationId}`);
    revalidatePath(`/pharmacy/medications/${medicationId}/edit`);
  }
  revalidatePath("/pharmacy/generics");
  revalidatePath("/pharmacy/manufacturers");
  revalidatePath("/pharmacy/reference-data");
  revalidatePath("/pharmacy/branch-availability");
  revalidatePath("/pharmacy/import");
}

async function validateMedicationReferences(tenantId: string, input: MedicationFormInput) {
  if (input.genericId) {
    const generic = await prisma.medicationGeneric.findFirst({
      where: { id: input.genericId, tenantId, isActive: true },
    });
    if (!generic) return MEDICATION_ERROR_CODES.MEDICATION_GENERIC_REQUIRED;
  }
  if (input.manufacturerId) {
    const manufacturer = await prisma.medicationManufacturer.findFirst({
      where: { id: input.manufacturerId, tenantId, isActive: true },
    });
    if (!manufacturer) return MEDICATION_ERROR_CODES.MEDICATION_MANUFACTURER_INVALID;
  }
  if (input.branchIds?.length) {
    const count = await prisma.branch.count({
      where: { tenantId, id: { in: input.branchIds }, isActive: true },
    });
    if (count !== input.branchIds.length) return MEDICATION_ERROR_CODES.MEDICATION_BRANCH_INVALID;
  }
  return null;
}

async function checkMedicationDuplicate(tenantId: string, input: MedicationFormInput, excludeId?: string) {
  if (input.barcode) {
    const barcodeDup = await prisma.medicationCatalogItem.findFirst({
      where: {
        tenantId,
        barcode: input.barcode,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (barcodeDup) return MEDICATION_ERROR_CODES.MEDICATION_BARCODE_DUPLICATE;
  }

  const candidates = await prisma.medicationCatalogItem.findMany({
    where: {
      tenantId,
      brandName: { equals: input.brandName, mode: "insensitive" },
      manufacturerId: input.manufacturerId ?? null,
      dosageFormId: input.dosageFormId ?? null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, displayStrength: true, strengthValue: true, strengthUnit: true },
  });

  const key = normalizeDuplicateKey([
    input.brandName,
    input.manufacturerId,
    input.dosageFormId,
    buildDisplayStrength(input),
  ]);

  for (const candidate of candidates) {
    const candidateKey = normalizeDuplicateKey([
      input.brandName,
      input.manufacturerId,
      input.dosageFormId,
      candidate.displayStrength,
    ]);
    if (candidateKey === key) return MEDICATION_ERROR_CODES.MEDICATION_DUPLICATE;
  }

  return null;
}

async function persistMedicationBranches(
  tenantId: string,
  medicationId: string,
  branchIds?: string[],
) {
  await prisma.branchMedication.deleteMany({ where: { tenantId, medicationCatalogItemId: medicationId } });
  if (!branchIds?.length) return;
  await prisma.branchMedication.createMany({
    data: branchIds.map((branchId) => ({
      tenantId,
      branchId,
      medicationCatalogItemId: medicationId,
      isAvailable: true,
    })),
    skipDuplicates: true,
  });
}

async function persistMedicationIngredients(
  tenantId: string,
  medicationId: string,
  input: MedicationFormInput,
) {
  await prisma.medicationIngredient.deleteMany({ where: { tenantId, medicationCatalogItemId: medicationId } });
  if (!input.ingredients?.length) return;
  await prisma.medicationIngredient.createMany({
    data: input.ingredients.map((ingredient, index) => ({
      tenantId,
      medicationCatalogItemId: medicationId,
      genericId: ingredient.genericId,
      strengthValue: ingredient.strengthValue,
      strengthUnit: ingredient.strengthUnit,
      sequence: ingredient.sequence ?? index,
    })),
  });
}

function medicationDataFromInput(input: MedicationFormInput) {
  return {
    brandName: input.brandName,
    genericId: input.genericId ?? null,
    manufacturerId: input.manufacturerId ?? null,
    categoryId: input.categoryId ?? null,
    dosageFormId: input.dosageFormId ?? null,
    routeId: input.routeId ?? null,
    unitId: input.unitId ?? null,
    genericDisplayName: input.genericDisplayName ?? null,
    strengthValue: input.strengthValue ?? null,
    strengthUnit: input.strengthUnit ?? null,
    denominatorValue: input.denominatorValue ?? null,
    denominatorUnit: input.denominatorUnit ?? null,
    displayStrength: buildDisplayStrength(input),
    routeCode: input.routeCode ?? null,
    sku: input.sku ?? null,
    barcode: input.barcode ?? null,
    packSize: input.packSize ?? null,
    packDescription: input.packDescription ?? null,
    defaultDose: input.defaultDose ?? null,
    defaultFrequency: input.defaultFrequency ?? null,
    defaultDuration: input.defaultDuration ?? null,
    defaultInstructions: input.defaultInstructions ?? null,
    isPrescriptionEnabled: input.isPrescriptionEnabled ?? true,
    isControlledMedicine: input.isControlledMedicine ?? false,
    requiresPrescription: input.requiresPrescription ?? true,
  };
}

export async function listMedicationsAction(filters?: {
  query?: string;
  status?: MedicationCatalogStatus;
}) {
  const session = await requireTenantPermission("/pharmacy/medications");
  return listMedications(session.tenantId, filters);
}

export async function getMedicationByIdAction(medicationId: string) {
  const session = await requireTenantPermission("/pharmacy/medications");
  return assertTenantOwnsMedication(session.tenantId, medicationId);
}

export async function searchMedicationCatalogAction(query: string) {
  const session = await requireTenantSession();
  await requireTenantPermission("/pharmacy/medications/search", "canView");
  const items = await searchPrescriptionMedications(session.tenantId, query, session.branchId);
  return items.map((item) => ({
    id: item.id,
    internalCode: item.internalCode,
    brandName: item.brandName,
    genericName: item.genericDisplayName ?? item.generic?.genericName ?? null,
    strength: item.displayStrength,
    dosageForm: item.dosageForm?.displayName ?? null,
    route: item.route?.code ?? item.routeCode,
    defaultDose: item.defaultDose,
    defaultFrequency: item.defaultFrequency,
    defaultDuration: item.defaultDuration,
    defaultInstructions: item.defaultInstructions,
    displayName: buildMedicationDisplayName(item),
  }));
}

export async function createMedicationAction(formData: FormData): Promise<MedicationActionResult> {
  const session = await requireTenantPermission("/pharmacy/medications/new", "canCreate");
  const parsed = parseMedicationFormData(formData);
  if ("errorCode" in parsed) return { ok: false, errorCode: parsed.errorCode ?? MEDICATION_ERROR_CODES.MEDICATION_VALIDATION };

  const refError = await validateMedicationReferences(session.tenantId, parsed);
  if (refError) return { ok: false, errorCode: refError };

  const dupError = await checkMedicationDuplicate(session.tenantId, parsed);
  if (dupError) return { ok: false, errorCode: dupError };

  const item = await prisma.$transaction(async (tx) => {
    const internalCode = await allocateMedicationCode(tx, session.tenantId);
    const created = await tx.medicationCatalogItem.create({
      data: {
        tenantId: session.tenantId,
        internalCode,
        ...medicationDataFromInput(parsed),
        status: "DRAFT",
        createdById: session.userId,
        updatedById: session.userId,
      },
    });
    if (parsed.ingredients?.length) {
      await tx.medicationIngredient.createMany({
        data: parsed.ingredients.map((ingredient, index) => ({
          tenantId: session.tenantId,
          medicationCatalogItemId: created.id,
          genericId: ingredient.genericId,
          strengthValue: ingredient.strengthValue,
          strengthUnit: ingredient.strengthUnit,
          sequence: ingredient.sequence ?? index,
        })),
      });
    }
    if (parsed.branchIds?.length) {
      await tx.branchMedication.createMany({
        data: parsed.branchIds.map((branchId) => ({
          tenantId: session.tenantId,
          branchId,
          medicationCatalogItemId: created.id,
        })),
      });
    }
    return created;
  });

  await auditMedicationEvent({
    tenantId: session.tenantId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "MEDICATION_CREATED",
    entityId: item.id,
    changeData: { internalCode: item.internalCode },
  });

  revalidateMedicationPaths(item.id);
  return { ok: true, medicationId: item.id, internalCode: item.internalCode };
}

export async function updateMedicationAction(
  medicationId: string,
  formData: FormData,
): Promise<MedicationActionResult> {
  const session = await requireTenantPermission("/pharmacy/medications/edit", "canEdit");
  const existing = await assertTenantOwnsMedication(session.tenantId, medicationId);
  const parsed = parseMedicationFormData(formData);
  if ("errorCode" in parsed) return { ok: false, errorCode: parsed.errorCode ?? MEDICATION_ERROR_CODES.MEDICATION_VALIDATION };

  const refError = await validateMedicationReferences(session.tenantId, parsed);
  if (refError) return { ok: false, errorCode: refError };

  const dupError = await checkMedicationDuplicate(session.tenantId, parsed, medicationId);
  if (dupError) return { ok: false, errorCode: dupError };

  await prisma.$transaction(async (tx) => {
    await tx.medicationCatalogItem.update({
      where: { id: medicationId },
      data: {
        ...medicationDataFromInput(parsed),
        updatedById: session.userId,
      },
    });
    await persistMedicationIngredients(session.tenantId, medicationId, parsed);
    await persistMedicationBranches(session.tenantId, medicationId, parsed.branchIds);
  });

  await auditMedicationEvent({
    tenantId: session.tenantId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "MEDICATION_UPDATED",
    entityId: medicationId,
  });

  revalidateMedicationPaths(medicationId);
  return { ok: true, medicationId };
}

async function transitionMedicationStatus(
  medicationId: string,
  nextStatus: MedicationCatalogStatus,
  event: string,
): Promise<MedicationActionResult> {
  const session = await requireTenantPermission("/pharmacy/medications/edit", "canEdit");
  const item = await assertTenantOwnsMedication(session.tenantId, medicationId);
  if (!canApplyMedicationStatusTransition(item.status, nextStatus)) {
    return { ok: false, errorCode: MEDICATION_ERROR_CODES.MEDICATION_STATUS_INVALID };
  }

  await prisma.medicationCatalogItem.update({
    where: { id: medicationId },
    data: {
      status: nextStatus,
      isActive: nextStatus === "ACTIVE",
      updatedById: session.userId,
    },
  });

  await auditMedicationEvent({
    tenantId: session.tenantId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event,
    entityId: medicationId,
    changeData: { status: nextStatus },
  });

  revalidateMedicationPaths(medicationId);
  return { ok: true, medicationId };
}

export async function activateMedicationAction(medicationId: string) {
  return transitionMedicationStatus(medicationId, "ACTIVE", "MEDICATION_ACTIVATED");
}

export async function deactivateMedicationAction(medicationId: string) {
  return transitionMedicationStatus(medicationId, "INACTIVE", "MEDICATION_DEACTIVATED");
}

export async function archiveMedicationAction(medicationId: string) {
  return transitionMedicationStatus(medicationId, "ARCHIVED", "MEDICATION_ARCHIVED");
}

export async function restoreMedicationAction(medicationId: string) {
  return transitionMedicationStatus(medicationId, "INACTIVE", "MEDICATION_RESTORED");
}

export async function createMedicationGenericAction(formData: FormData): Promise<MedicationActionResult> {
  const session = await requireTenantPermission("/pharmacy/generics", "canCreate");
  const parsed = parseGenericFormData(formData);
  if ("errorCode" in parsed) return { ok: false, errorCode: parsed.errorCode ?? MEDICATION_ERROR_CODES.MEDICATION_VALIDATION };

  const duplicate = await prisma.medicationGeneric.findFirst({
    where: { tenantId: session.tenantId, genericCode: parsed.genericCode },
  });
  if (duplicate) return { ok: false, errorCode: MEDICATION_ERROR_CODES.GENERIC_DUPLICATE };

  const generic = await prisma.medicationGeneric.create({
    data: {
      tenantId: session.tenantId,
      genericCode: parsed.genericCode,
      genericName: parsed.genericName,
      categoryId: parsed.categoryId ?? null,
      isControlled: parsed.isControlled,
      isHighAlert: parsed.isHighAlert,
      createdById: session.userId,
      updatedById: session.userId,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    actionType: "INSERT",
    entityType: "MedicationGeneric",
    entityId: generic.id,
    changeData: { event: "GENERIC_CREATED" },
    createdBy: session.user.name,
  });

  revalidateMedicationPaths();
  return { ok: true, medicationId: generic.id };
}

export async function createManufacturerAction(formData: FormData): Promise<MedicationActionResult> {
  const session = await requireTenantPermission("/pharmacy/manufacturers", "canCreate");
  const parsed = parseManufacturerFormData(formData);
  if ("errorCode" in parsed) return { ok: false, errorCode: parsed.errorCode ?? MEDICATION_ERROR_CODES.MEDICATION_VALIDATION };

  const duplicate = await prisma.medicationManufacturer.findFirst({
    where: { tenantId: session.tenantId, name: { equals: parsed.name, mode: "insensitive" } },
  });
  if (duplicate) return { ok: false, errorCode: MEDICATION_ERROR_CODES.MANUFACTURER_DUPLICATE };

  const manufacturer = await prisma.medicationManufacturer.create({
    data: {
      tenantId: session.tenantId,
      ...parsed,
      createdById: session.userId,
      updatedById: session.userId,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    actionType: "INSERT",
    entityType: "MedicationManufacturer",
    entityId: manufacturer.id,
    changeData: { event: "MANUFACTURER_CREATED" },
    createdBy: session.user.name,
  });

  revalidateMedicationPaths();
  return { ok: true, medicationId: manufacturer.id };
}

export async function listGenericsAction() {
  const session = await requireTenantPermission("/pharmacy/generics");
  return prisma.medicationGeneric.findMany({
    where: { tenantId: session.tenantId },
    include: { category: true },
    orderBy: { genericName: "asc" },
  });
}

export async function listManufacturersAction() {
  const session = await requireTenantPermission("/pharmacy/manufacturers");
  return prisma.medicationManufacturer.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: "asc" },
  });
}

export async function listReferenceDataAction() {
  const session = await requireTenantPermission("/pharmacy/reference-data");
  const tenantId = session.tenantId;
  const [dosageForms, routes, categories, units] = await Promise.all([
    prisma.medicationDosageForm.findMany({ where: { tenantId }, orderBy: { displayName: "asc" } }),
    prisma.medicationRoute.findMany({ where: { tenantId }, orderBy: { displayName: "asc" } }),
    prisma.medicationCategory.findMany({ where: { tenantId }, orderBy: { displayName: "asc" } }),
    prisma.medicationUnit.findMany({ where: { tenantId }, orderBy: { displayName: "asc" } }),
  ]);
  return { dosageForms, routes, categories, units };
}

export async function updateBranchMedicationAvailabilityAction(input: {
  medicationId: string;
  branchId: string;
  isAvailable: boolean;
}): Promise<MedicationActionResult> {
  const session = await requireTenantPermission("/pharmacy/branch-availability", "canEdit");
  await assertTenantOwnsMedication(session.tenantId, input.medicationId);
  const branch = await prisma.branch.findFirst({
    where: { id: input.branchId, tenantId: session.tenantId, isActive: true },
  });
  if (!branch) return { ok: false, errorCode: MEDICATION_ERROR_CODES.MEDICATION_BRANCH_INVALID };

  await prisma.branchMedication.upsert({
    where: {
      tenantId_branchId_medicationCatalogItemId: {
        tenantId: session.tenantId,
        branchId: input.branchId,
        medicationCatalogItemId: input.medicationId,
      },
    },
    create: {
      tenantId: session.tenantId,
      branchId: input.branchId,
      medicationCatalogItemId: input.medicationId,
      isAvailable: input.isAvailable,
    },
    update: { isAvailable: input.isAvailable },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    actionType: "UPDATE",
    entityType: "BranchMedication",
    entityId: input.medicationId,
    changeData: {
      event: input.isAvailable ? "MEDICATION_BRANCH_ENABLED" : "MEDICATION_BRANCH_DISABLED",
      branchId: input.branchId,
    },
    createdBy: session.user.name,
  });

  revalidateMedicationPaths(input.medicationId);
  return { ok: true, medicationId: input.medicationId };
}

export async function previewMedicationImportAction(csvContent: string) {
  const session = await requireTenantPermission("/pharmacy/import", "canCreate");
  const rows = parseMedicationImportCsv(csvContent);
  return { tenantId: session.tenantId, rows, validCount: rows.filter((row) => row.errors.length === 0).length };
}

export async function applyMedicationImportAction(csvContent: string): Promise<MedicationActionResult> {
  const session = await requireTenantPermission("/pharmacy/import", "canCreate");
  const rows = parseMedicationImportCsv(csvContent).filter((row) => row.errors.length === 0);
  if (!rows.length) return { ok: false, errorCode: MEDICATION_ERROR_CODES.MEDICATION_IMPORT_INVALID };

  let applied = 0;
  for (const row of rows) {
    const genericCode = normalizeMedicationText(row.genericName).replace(/\s+/g, "_").toUpperCase().slice(0, 20);
    let generic = await prisma.medicationGeneric.findFirst({
      where: { tenantId: session.tenantId, genericCode },
    });
    if (!generic) {
      generic = await prisma.medicationGeneric.create({
        data: {
          tenantId: session.tenantId,
          genericCode,
          genericName: row.genericName,
          createdById: session.userId,
          updatedById: session.userId,
        },
      });
    }

    let manufacturerId: string | undefined;
    if (row.manufacturer) {
      let manufacturer = await prisma.medicationManufacturer.findFirst({
        where: { tenantId: session.tenantId, name: { equals: row.manufacturer, mode: "insensitive" } },
      });
      if (!manufacturer) {
        manufacturer = await prisma.medicationManufacturer.create({
          data: {
            tenantId: session.tenantId,
            name: row.manufacturer,
            createdById: session.userId,
            updatedById: session.userId,
          },
        });
      }
      manufacturerId = manufacturer.id;
    }

    const dup = await checkMedicationDuplicate(session.tenantId, {
      brandName: row.brandName,
      genericId: generic.id,
      manufacturerId,
      genericDisplayName: row.genericName,
    });
    if (dup) continue;

    await prisma.$transaction(async (tx) => {
      const internalCode = row.internalCode?.trim() || (await allocateMedicationCode(tx, session.tenantId));
      await tx.medicationCatalogItem.create({
        data: {
          tenantId: session.tenantId,
          internalCode,
          brandName: row.brandName,
          genericId: generic.id,
          manufacturerId: manufacturerId ?? null,
          genericDisplayName: row.genericName,
          displayStrength: row.strength ?? null,
          routeCode: row.route ?? null,
          packSize: row.packSize ?? null,
          barcode: row.barcode ?? null,
          isPrescriptionEnabled: row.prescriptionEnabled ?? true,
          status: row.active ? "ACTIVE" : "DRAFT",
          isActive: row.active ?? true,
          createdById: session.userId,
          updatedById: session.userId,
        },
      });
    });
    applied += 1;
  }

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    actionType: "INSERT",
    entityType: "MedicationImport",
    entityId: session.tenantId,
    changeData: { event: "MEDICATION_IMPORT_COMPLETED", rowsApplied: applied },
    createdBy: session.user.name,
  });

  revalidateMedicationPaths();
  return { ok: true, rowsApplied: applied };
}

export async function listBranchesForMedicationAction() {
  const session = await requireTenantPermission("/pharmacy/branch-availability");
  return prisma.branch.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function assertMedicationNotHardDeletable(tenantId: string, medicationId: string) {
  if (await medicationReferencedByPrescription(tenantId, medicationId)) {
    throw new Error(MEDICATION_ERROR_CODES.MEDICATION_IN_USE);
  }
}
