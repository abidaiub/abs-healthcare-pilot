import type { PrescriptionDurationUnit } from "@/generated/prisma/client";
import { PRESCRIPTION_ERROR_CODES } from "@/lib/prescription/errors";
import {
  STRUCTURED_FREQUENCIES,
  calculateQuantityFromStructured,
} from "@/lib/prescription/constants";

export type PrescriptionMedicineInput = {
  medicineName: string;
  medicationCatalogItemId: string | null;
  genericName: string | null;
  strength: string | null;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  durationValue: number | null;
  durationUnit: PrescriptionDurationUnit | null;
  durationText: string | null;
  quantity: string | null;
  foodTiming: string | null;
  instructions: string | null;
};

function trimOrNull(value: FormDataEntryValue | null, max = 500): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return raw.slice(0, max);
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

const DURATION_UNITS: PrescriptionDurationUnit[] = ["DAY", "WEEK", "MONTH"];

export function parseMedicineFormData(
  formData: FormData,
): PrescriptionMedicineInput | { errorCode: string } {
  const medicineName = trimOrNull(formData.get("medicineName"), 500);
  if (!medicineName) {
    return { errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_MEDICINE_INVALID };
  }

  const dose = trimOrNull(formData.get("dose"), 100);
  if (dose && dose.length > 100) {
    return { errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_MEDICINE_INVALID };
  }

  const durationValue = parseOptionalInt(formData.get("durationValue"));
  const durationUnitRaw = String(formData.get("durationUnit") ?? "").trim().toUpperCase();
  const durationUnit = DURATION_UNITS.includes(durationUnitRaw as PrescriptionDurationUnit)
    ? (durationUnitRaw as PrescriptionDurationUnit)
    : null;

  const quantityRaw = trimOrNull(formData.get("quantity"), 50);
  if (quantityRaw && !/^\d+(\.\d+)?$/.test(quantityRaw)) {
    return { errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_MEDICINE_INVALID };
  }

  const frequencyRaw = trimOrNull(formData.get("frequency"), 50);
  const frequency = frequencyRaw?.toUpperCase() ?? null;
  if (frequency && !STRUCTURED_FREQUENCIES.includes(frequency as (typeof STRUCTURED_FREQUENCIES)[number])) {
    // allow free-text frequency as fallback
  }

  let quantity = quantityRaw;
  if (!quantity && frequency && durationValue && durationUnit) {
    quantity = calculateQuantityFromStructured({ frequency, durationValue, durationUnit });
  }

  return {
    medicineName,
    medicationCatalogItemId: trimOrNull(formData.get("medicationCatalogItemId"), 50),
    genericName: trimOrNull(formData.get("genericName"), 200),
    strength: trimOrNull(formData.get("strength"), 100),
    dose,
    route: trimOrNull(formData.get("route"), 100),
    frequency,
    durationValue,
    durationUnit,
    durationText: trimOrNull(formData.get("durationText"), 100),
    quantity,
    foodTiming: trimOrNull(formData.get("foodTiming"), 100),
    instructions: trimOrNull(formData.get("instructions"), 1000),
  };
}

export function parseDraftUpdateFormData(formData: FormData) {
  const followUpDateRaw = String(formData.get("followUpDate") ?? "").trim();
  let followUpDate: Date | null = null;
  if (followUpDateRaw) {
    followUpDate = new Date(followUpDateRaw);
    if (Number.isNaN(followUpDate.getTime())) {
      return { errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_VALIDATION };
    }
  }
  const followUpIntervalDays = parseOptionalInt(formData.get("followUpIntervalDays"));
  if (followUpDate && followUpIntervalDays) {
    return { errorCode: PRESCRIPTION_ERROR_CODES.PRESCRIPTION_VALIDATION };
  }

  return {
    generalAdvice: trimOrNull(formData.get("generalAdvice")),
    followUpDate,
    followUpIntervalDays,
    followUpInstructions: trimOrNull(formData.get("followUpInstructions")),
    clinicalSummary: trimOrNull(formData.get("clinicalSummary")),
  };
}

export function detectDuplicateMedicineWarning(
  medicines: Array<{ medicineName: string; strength: string | null; dose: string | null }>,
  candidate: PrescriptionMedicineInput,
): boolean {
  const key = `${candidate.medicineName.toLowerCase()}|${candidate.strength ?? ""}|${candidate.dose ?? ""}`;
  return medicines.some(
    (row) => `${row.medicineName.toLowerCase()}|${row.strength ?? ""}|${row.dose ?? ""}` === key,
  );
}
