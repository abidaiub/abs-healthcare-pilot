import type { DiagnosisType } from "@/generated/prisma/client";
import { ENCOUNTER_ERROR_CODES } from "@/lib/consultation/errors";
import { calculateBmi } from "@/lib/consultation/constants";

export type VitalsInput = {
  heightCm: number | null;
  weightKg: number | null;
  temperatureC: number | null;
  pulseBpm: number | null;
  respiratoryRate: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  spo2Percent: number | null;
  bloodGlucoseMgDl: number | null;
  notes: string | null;
};

export type ConsultationDraftInput = {
  chiefComplaint: string | null;
  historyOfPresentIllness: string | null;
  pastMedicalHistory: string | null;
  pastSurgicalHistory: string | null;
  allergyNotes: string | null;
  familyHistory: string | null;
  socialHistory: string | null;
  examinationNotes: string | null;
  clinicalNotes: string | null;
  generalAdvice: string | null;
  followUpDate: Date | null;
  followUpIntervalDays: number | null;
  followUpInstructions: string | null;
};

const DIAGNOSIS_TYPES: DiagnosisType[] = [
  "PRIMARY",
  "SECONDARY",
  "PROVISIONAL",
  "CONFIRMED",
];

function parseOptionalNumber(value: FormDataEntryValue | null, field: string): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`${field}_INVALID`);
  }
  return parsed;
}

function parseOptionalInt(value: FormDataEntryValue | null, field: string): number | null {
  const parsed = parseOptionalNumber(value, field);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed)) {
    throw new Error(`${field}_INVALID`);
  }
  return parsed;
}

function trimOrNull(value: FormDataEntryValue | null, max = 4000): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return raw.slice(0, max);
}

export function parseConsultationDraftFormData(
  formData: FormData,
): ConsultationDraftInput | { errorCode: string } {
  try {
    const followUpDateRaw = String(formData.get("followUpDate") ?? "").trim();
    let followUpDate: Date | null = null;
    if (followUpDateRaw) {
      followUpDate = new Date(followUpDateRaw);
      if (Number.isNaN(followUpDate.getTime())) {
        return { errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
      }
    }

    const followUpIntervalDays = parseOptionalInt(formData.get("followUpIntervalDays"), "followUpIntervalDays");
    if (followUpDate && followUpIntervalDays) {
      return { errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
    }

    return {
      chiefComplaint: trimOrNull(formData.get("chiefComplaint"), 2000),
      historyOfPresentIllness: trimOrNull(formData.get("historyOfPresentIllness")),
      pastMedicalHistory: trimOrNull(formData.get("pastMedicalHistory")),
      pastSurgicalHistory: trimOrNull(formData.get("pastSurgicalHistory")),
      allergyNotes: trimOrNull(formData.get("allergyNotes")),
      familyHistory: trimOrNull(formData.get("familyHistory")),
      socialHistory: trimOrNull(formData.get("socialHistory")),
      examinationNotes: trimOrNull(formData.get("examinationNotes")),
      clinicalNotes: trimOrNull(formData.get("clinicalNotes")),
      generalAdvice: trimOrNull(formData.get("generalAdvice")),
      followUpDate,
      followUpIntervalDays,
      followUpInstructions: trimOrNull(formData.get("followUpInstructions")),
    };
  } catch {
    return { errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }
}

export function parseVitalsFormData(formData: FormData): VitalsInput | { errorCode: string } {
  try {
    const heightCm = parseOptionalNumber(formData.get("heightCm"), "heightCm");
    const weightKg = parseOptionalNumber(formData.get("weightKg"), "weightKg");
    const temperatureC = parseOptionalNumber(formData.get("temperatureC"), "temperatureC");
    const pulseBpm = parseOptionalInt(formData.get("pulseBpm"), "pulseBpm");
    const respiratoryRate = parseOptionalInt(formData.get("respiratoryRate"), "respiratoryRate");
    const systolicBp = parseOptionalInt(formData.get("systolicBp"), "systolicBp");
    const diastolicBp = parseOptionalInt(formData.get("diastolicBp"), "diastolicBp");
    const spo2Percent = parseOptionalInt(formData.get("spo2Percent"), "spo2Percent");
    const bloodGlucoseMgDl = parseOptionalNumber(formData.get("bloodGlucoseMgDl"), "bloodGlucoseMgDl");

    if (heightCm !== null && (heightCm < 30 || heightCm > 250)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (weightKg !== null && (weightKg < 1 || weightKg > 400)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (temperatureC !== null && (temperatureC < 30 || temperatureC > 45)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (pulseBpm !== null && (pulseBpm < 20 || pulseBpm > 250)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (respiratoryRate !== null && (respiratoryRate < 5 || respiratoryRate > 80)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (systolicBp !== null && (systolicBp < 50 || systolicBp > 280)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (diastolicBp !== null && (diastolicBp < 30 || diastolicBp > 180)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (spo2Percent !== null && (spo2Percent < 50 || spo2Percent > 100)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (bloodGlucoseMgDl !== null && (bloodGlucoseMgDl < 20 || bloodGlucoseMgDl > 800)) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }
    if (
      systolicBp !== null &&
      diastolicBp !== null &&
      diastolicBp >= systolicBp
    ) {
      return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
    }

    return {
      heightCm,
      weightKg,
      temperatureC,
      pulseBpm,
      respiratoryRate,
      systolicBp,
      diastolicBp,
      spo2Percent,
      bloodGlucoseMgDl,
      notes: trimOrNull(formData.get("vitalsNotes"), 1000),
    };
  } catch {
    return { errorCode: ENCOUNTER_ERROR_CODES.VITALS_INVALID };
  }
}

export function parseDiagnosisFormData(formData: FormData) {
  const diagnosisText = trimOrNull(formData.get("diagnosisText"), 500);
  if (!diagnosisText) {
    return { errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }
  const typeRaw = String(formData.get("diagnosisType") ?? "PRIMARY").toUpperCase();
  const diagnosisType = DIAGNOSIS_TYPES.includes(typeRaw as DiagnosisType)
    ? (typeRaw as DiagnosisType)
    : "PRIMARY";
  return {
    diagnosisType,
    diagnosisText,
    icdCode: trimOrNull(formData.get("icdCode"), 32),
    notes: trimOrNull(formData.get("diagnosisNotes"), 1000),
  };
}

export function parseMedicineAdviceFormData(formData: FormData) {
  const medicineText = trimOrNull(formData.get("medicineText"), 500);
  if (!medicineText) {
    return { errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }
  return {
    medicineText,
    strength: trimOrNull(formData.get("strength"), 100),
    dose: trimOrNull(formData.get("dose"), 100),
    route: trimOrNull(formData.get("route"), 100),
    frequency: trimOrNull(formData.get("frequency"), 100),
    duration: trimOrNull(formData.get("duration"), 100),
    quantity: trimOrNull(formData.get("quantity"), 50),
    instructions: trimOrNull(formData.get("instructions"), 1000),
    foodTiming: trimOrNull(formData.get("foodTiming"), 100),
  };
}

export function parseInvestigationAdviceFormData(formData: FormData) {
  const investigationText = trimOrNull(formData.get("investigationText"), 500);
  if (!investigationText) {
    return { errorCode: ENCOUNTER_ERROR_CODES.ENCOUNTER_VALIDATION };
  }
  return {
    investigationText,
    priority: trimOrNull(formData.get("priority"), 50),
    instructions: trimOrNull(formData.get("instructions"), 1000),
    clinicalNote: trimOrNull(formData.get("clinicalNote"), 1000),
  };
}

export function vitalsToDb(input: VitalsInput) {
  const bmi =
    input.heightCm !== null && input.weightKg !== null
      ? calculateBmi(input.heightCm, input.weightKg)
      : null;
  return {
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    temperatureC: input.temperatureC,
    pulseBpm: input.pulseBpm,
    respiratoryRate: input.respiratoryRate,
    systolicBp: input.systolicBp,
    diastolicBp: input.diastolicBp,
    spo2Percent: input.spo2Percent,
    bloodGlucoseMgDl: input.bloodGlucoseMgDl,
    bmi,
    notes: input.notes,
  };
}
