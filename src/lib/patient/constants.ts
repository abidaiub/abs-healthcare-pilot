import type { BloodGroup, MaritalStatus, PatientGender } from "@/generated/prisma/client";

export const PATIENT_GENDERS: PatientGender[] = ["MALE", "FEMALE", "OTHER", "UNKNOWN"];

export const PATIENT_GENDER_I18N_KEYS: Record<PatientGender, string> = {
  MALE: "patient.gender.male",
  FEMALE: "patient.gender.female",
  OTHER: "patient.gender.other",
  UNKNOWN: "patient.gender.unknown",
};

export const BLOOD_GROUPS: BloodGroup[] = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
  "UNKNOWN",
];

export const BLOOD_GROUP_I18N_KEYS: Record<BloodGroup, string> = {
  A_POSITIVE: "patient.bloodGroup.aPositive",
  A_NEGATIVE: "patient.bloodGroup.aNegative",
  B_POSITIVE: "patient.bloodGroup.bPositive",
  B_NEGATIVE: "patient.bloodGroup.bNegative",
  AB_POSITIVE: "patient.bloodGroup.abPositive",
  AB_NEGATIVE: "patient.bloodGroup.abNegative",
  O_POSITIVE: "patient.bloodGroup.oPositive",
  O_NEGATIVE: "patient.bloodGroup.oNegative",
  UNKNOWN: "patient.bloodGroup.unknown",
};

export const MARITAL_STATUSES: MaritalStatus[] = [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
  "UNKNOWN",
];

export const MARITAL_STATUS_I18N_KEYS: Record<MaritalStatus, string> = {
  SINGLE: "patient.maritalStatus.single",
  MARRIED: "patient.maritalStatus.married",
  DIVORCED: "patient.maritalStatus.divorced",
  WIDOWED: "patient.maritalStatus.widowed",
  SEPARATED: "patient.maritalStatus.separated",
  UNKNOWN: "patient.maritalStatus.unknown",
};

export const DUPLICATE_MATCH_I18N_KEYS = {
  MOBILE: "patient.duplicate.matchMobile",
  NATIONAL_ID: "patient.duplicate.matchNationalId",
  PASSPORT: "patient.duplicate.matchPassport",
  NAME_DOB: "patient.duplicate.matchNameDob",
  NAME_GUARDIAN_MOBILE: "patient.duplicate.matchNameGuardianMobile",
} as const;
