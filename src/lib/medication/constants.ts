import type { MedicationCatalogStatus } from "@/generated/prisma/client";

export const MEDICATION_CODE_PREFIX = "MED";
export const MEDICATION_CODE_PAD = 6;

export function formatMedicationCode(sequence: number): string {
  return `${MEDICATION_CODE_PREFIX}-${String(sequence).padStart(MEDICATION_CODE_PAD, "0")}`;
}

export function isValidMedicationCode(value: string): boolean {
  return /^MED-\d{6}$/.test(value);
}

export const MEDICATION_STATUS_I18N_KEYS: Record<MedicationCatalogStatus, string> = {
  DRAFT: "pharmacy.status.draft",
  ACTIVE: "pharmacy.status.active",
  INACTIVE: "pharmacy.status.inactive",
  ARCHIVED: "pharmacy.status.archived",
};

const STATUS_TRANSITIONS: Record<MedicationCatalogStatus, MedicationCatalogStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["INACTIVE", "ARCHIVED"],
  INACTIVE: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: ["INACTIVE"],
};

export function canTransitionMedicationStatus(
  from: MedicationCatalogStatus,
  to: MedicationCatalogStatus,
): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isMedicationSelectable(status: MedicationCatalogStatus): boolean {
  return status === "ACTIVE";
}

export const DEFAULT_DOSAGE_FORMS = [
  { code: "TABLET", displayName: "Tablet", shortName: "Tab" },
  { code: "CAPSULE", displayName: "Capsule", shortName: "Cap" },
  { code: "SYRUP", displayName: "Syrup", shortName: "Syr" },
  { code: "SUSPENSION", displayName: "Suspension", shortName: "Susp" },
  { code: "INJECTION", displayName: "Injection", shortName: "Inj" },
  { code: "CREAM", displayName: "Cream", shortName: "Crm" },
  { code: "OINTMENT", displayName: "Ointment", shortName: "Oint" },
  { code: "DROPS", displayName: "Drops", shortName: "Drops" },
  { code: "INHALER", displayName: "Inhaler", shortName: "Inh" },
  { code: "SUPPOSITORY", displayName: "Suppository", shortName: "Supp" },
  { code: "POWDER", displayName: "Powder", shortName: "Pwd" },
  { code: "SOLUTION", displayName: "Solution", shortName: "Sol" },
] as const;

export const DEFAULT_ROUTES = [
  { code: "ORAL", displayName: "Oral" },
  { code: "IV", displayName: "Intravenous" },
  { code: "IM", displayName: "Intramuscular" },
  { code: "SC", displayName: "Subcutaneous" },
  { code: "TOPICAL", displayName: "Topical" },
  { code: "INHALATION", displayName: "Inhalation" },
  { code: "RECTAL", displayName: "Rectal" },
  { code: "VAGINAL", displayName: "Vaginal" },
  { code: "OPHTHALMIC", displayName: "Ophthalmic" },
  { code: "OTIC", displayName: "Otic" },
  { code: "NASAL", displayName: "Nasal" },
] as const;

export const DEFAULT_CATEGORIES = [
  { code: "ANALGESIC", displayName: "Analgesic" },
  { code: "ANTIBIOTIC", displayName: "Antibiotic" },
  { code: "ANTIHYPERTENSIVE", displayName: "Antihypertensive" },
  { code: "ANTIDIABETIC", displayName: "Antidiabetic" },
  { code: "GI", displayName: "Gastrointestinal" },
  { code: "RESPIRATORY", displayName: "Respiratory" },
  { code: "DERMATOLOGICAL", displayName: "Dermatological" },
  { code: "SUPPLEMENT", displayName: "Supplement" },
  { code: "OTHER", displayName: "Other" },
] as const;

export const DEFAULT_UNITS = [
  { code: "MG", displayName: "mg" },
  { code: "G", displayName: "g" },
  { code: "ML", displayName: "mL" },
  { code: "MCG", displayName: "mcg" },
  { code: "IU", displayName: "IU" },
  { code: "PERCENT", displayName: "%" },
] as const;

export const MEDICATION_IMPORT_MAX_ROWS = 500;
export const MEDICATION_SEARCH_LIMIT = 25;
