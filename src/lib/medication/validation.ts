import type { MedicationCatalogStatus } from "@/generated/prisma/client";
import { MEDICATION_ERROR_CODES } from "@/lib/medication/errors";
import { normalizeMedicationText } from "@/lib/medication/normalize";

const STRENGTH_UNITS = new Set(["mg", "g", "mcg", "ml", "iu", "%"]);

export type MedicationIngredientInput = {
  genericId: string;
  strengthValue?: number;
  strengthUnit?: string;
  sequence?: number;
};

export type MedicationFormInput = {
  brandName: string;
  genericId?: string;
  manufacturerId?: string;
  categoryId?: string;
  dosageFormId?: string;
  routeId?: string;
  unitId?: string;
  genericDisplayName?: string;
  strengthValue?: number;
  strengthUnit?: string;
  denominatorValue?: number;
  denominatorUnit?: string;
  routeCode?: string;
  sku?: string;
  barcode?: string;
  packSize?: string;
  packDescription?: string;
  defaultDose?: string;
  defaultFrequency?: string;
  defaultDuration?: string;
  defaultInstructions?: string;
  isPrescriptionEnabled?: boolean;
  isControlledMedicine?: boolean;
  requiresPrescription?: boolean;
  ingredients?: MedicationIngredientInput[];
  branchIds?: string[];
};

export function buildDisplayStrength(input: {
  strengthValue?: number;
  strengthUnit?: string;
  denominatorValue?: number;
  denominatorUnit?: string;
}): string | null {
  const { strengthValue, strengthUnit, denominatorValue, denominatorUnit } = input;
  if (!strengthValue || !strengthUnit) return null;
  const unit = strengthUnit.trim();
  if (denominatorValue && denominatorUnit) {
    return `${strengthValue} ${unit} / ${denominatorValue} ${denominatorUnit.trim()}`;
  }
  return `${strengthValue} ${unit}`;
}

export function validateStrength(input: {
  strengthValue?: number;
  strengthUnit?: string;
}): { ok: true } | { ok: false; errorCode: string } {
  if (input.strengthValue === undefined && !input.strengthUnit) return { ok: true };
  if (input.strengthValue === undefined || !input.strengthUnit?.trim()) {
    return { ok: false, errorCode: MEDICATION_ERROR_CODES.MEDICATION_INVALID_STRENGTH };
  }
  if (input.strengthValue <= 0) {
    return { ok: false, errorCode: MEDICATION_ERROR_CODES.MEDICATION_INVALID_STRENGTH };
  }
  if (!STRENGTH_UNITS.has(input.strengthUnit.trim().toLowerCase())) {
    return { ok: false, errorCode: MEDICATION_ERROR_CODES.MEDICATION_INVALID_STRENGTH };
  }
  return { ok: true };
}

export function parseMedicationFormData(formData: FormData): MedicationFormInput | { errorCode: string } {
  const brandName = formData.get("brandName")?.toString().trim() ?? "";
  if (!brandName) {
    return { errorCode: MEDICATION_ERROR_CODES.MEDICATION_VALIDATION };
  }

  const parseOptionalNumber = (key: string) => {
    const raw = formData.get(key)?.toString().trim();
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };

  const ingredientsRaw = formData.get("ingredientsJson")?.toString();
  let ingredients: MedicationIngredientInput[] | undefined;
  if (ingredientsRaw) {
    try {
      const parsed = JSON.parse(ingredientsRaw) as MedicationIngredientInput[];
      if (Array.isArray(parsed)) ingredients = parsed;
    } catch {
      return { errorCode: MEDICATION_ERROR_CODES.MEDICATION_VALIDATION };
    }
  }

  const branchIdsRaw = formData.get("branchIds")?.toString();
  const branchIds = branchIdsRaw
    ? branchIdsRaw.split(",").map((value) => value.trim()).filter(Boolean)
    : undefined;

  const input: MedicationFormInput = {
    brandName,
    genericId: formData.get("genericId")?.toString() || undefined,
    manufacturerId: formData.get("manufacturerId")?.toString() || undefined,
    categoryId: formData.get("categoryId")?.toString() || undefined,
    dosageFormId: formData.get("dosageFormId")?.toString() || undefined,
    routeId: formData.get("routeId")?.toString() || undefined,
    unitId: formData.get("unitId")?.toString() || undefined,
    genericDisplayName: formData.get("genericDisplayName")?.toString().trim() || undefined,
    strengthValue: parseOptionalNumber("strengthValue"),
    strengthUnit: formData.get("strengthUnit")?.toString().trim() || undefined,
    denominatorValue: parseOptionalNumber("denominatorValue"),
    denominatorUnit: formData.get("denominatorUnit")?.toString().trim() || undefined,
    routeCode: formData.get("routeCode")?.toString().trim() || undefined,
    sku: formData.get("sku")?.toString().trim() || undefined,
    barcode: formData.get("barcode")?.toString().trim() || undefined,
    packSize: formData.get("packSize")?.toString().trim() || undefined,
    packDescription: formData.get("packDescription")?.toString().trim() || undefined,
    defaultDose: formData.get("defaultDose")?.toString().trim() || undefined,
    defaultFrequency: formData.get("defaultFrequency")?.toString().trim() || undefined,
    defaultDuration: formData.get("defaultDuration")?.toString().trim() || undefined,
    defaultInstructions: formData.get("defaultInstructions")?.toString().trim() || undefined,
    isPrescriptionEnabled: formData.get("isPrescriptionEnabled") === "on" || formData.get("isPrescriptionEnabled") === "true",
    isControlledMedicine: formData.get("isControlledMedicine") === "on" || formData.get("isControlledMedicine") === "true",
    requiresPrescription: formData.get("requiresPrescription") !== "false",
    ingredients,
    branchIds,
  };

  const strengthCheck = validateStrength(input);
  if (!strengthCheck.ok) return strengthCheck;

  if (!input.genericId && (!input.ingredients || input.ingredients.length === 0)) {
    return { errorCode: MEDICATION_ERROR_CODES.MEDICATION_GENERIC_REQUIRED };
  }

  return input;
}

export function parseGenericFormData(formData: FormData) {
  const genericName = formData.get("genericName")?.toString().trim() ?? "";
  const genericCode = formData.get("genericCode")?.toString().trim().toUpperCase() ?? "";
  if (!genericName || !genericCode) {
    return { errorCode: MEDICATION_ERROR_CODES.MEDICATION_VALIDATION } as const;
  }
  return {
    genericName,
    genericCode,
    categoryId: formData.get("categoryId")?.toString() || undefined,
    isControlled: formData.get("isControlled") === "on",
    isHighAlert: formData.get("isHighAlert") === "on",
  };
}

export function parseManufacturerFormData(formData: FormData) {
  const name = formData.get("name")?.toString().trim() ?? "";
  if (!name) return { errorCode: MEDICATION_ERROR_CODES.MEDICATION_VALIDATION } as const;
  return {
    name,
    shortName: formData.get("shortName")?.toString().trim() || undefined,
    registrationNumber: formData.get("registrationNumber")?.toString().trim() || undefined,
    country: formData.get("country")?.toString().trim() || undefined,
    contactPhone: formData.get("contactPhone")?.toString().trim() || undefined,
    contactEmail: formData.get("contactEmail")?.toString().trim() || undefined,
  };
}

export function normalizeDuplicateKey(parts: Array<string | null | undefined>): string {
  return parts.map((part) => normalizeMedicationText(part ?? "")).join("|");
}

export function canApplyMedicationStatusTransition(
  current: MedicationCatalogStatus,
  next: MedicationCatalogStatus,
): boolean {
  const map: Record<MedicationCatalogStatus, MedicationCatalogStatus[]> = {
    DRAFT: ["ACTIVE", "ARCHIVED"],
    ACTIVE: ["INACTIVE", "ARCHIVED"],
    INACTIVE: ["ACTIVE", "ARCHIVED"],
    ARCHIVED: ["INACTIVE"],
  };
  return map[current]?.includes(next) ?? false;
}

export type MedicationImportRow = {
  rowNumber: number;
  brandName: string;
  genericName: string;
  manufacturer?: string;
  strength?: string;
  dosageForm?: string;
  route?: string;
  category?: string;
  unit?: string;
  packSize?: string;
  internalCode?: string;
  barcode?: string;
  prescriptionEnabled?: boolean;
  active?: boolean;
  errors: string[];
};

export function parseMedicationImportCsv(content: string): MedicationImportRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];
  const rows: MedicationImportRow[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const cols = lines[index].split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    const row: MedicationImportRow = {
      rowNumber: index + 1,
      brandName: cols[0] ?? "",
      genericName: cols[1] ?? "",
      manufacturer: cols[2] || undefined,
      strength: cols[3] || undefined,
      dosageForm: cols[4] || undefined,
      route: cols[5] || undefined,
      category: cols[6] || undefined,
      unit: cols[7] || undefined,
      packSize: cols[8] || undefined,
      internalCode: cols[9] || undefined,
      barcode: cols[10] || undefined,
      prescriptionEnabled: (cols[11] ?? "true").toLowerCase() !== "false",
      active: (cols[12] ?? "true").toLowerCase() !== "false",
      errors: [],
    };
    if (!row.brandName) row.errors.push("brand_name required");
    if (!row.genericName) row.errors.push("generic_name required");
    rows.push(row);
  }
  return rows;
}
