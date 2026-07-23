import type {
  BloodGroup,
  MaritalStatus,
  PatientGender,
} from "@/generated/prisma/client";
import {
  MAX_ESTIMATED_AGE,
  MIN_ESTIMATED_AGE,
  PATIENT_ERROR_CODES,
} from "@/lib/patient/errors";
import {
  buildFullName,
  normalizeEmail,
  normalizeMobile,
  normalizeNationalId,
  normalizePassport,
} from "@/lib/patient/normalize";

export type PatientFormInput = {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  preferredName: string | null;
  gender: PatientGender;
  dateOfBirth: Date | null;
  estimatedAge: number | null;
  ageAsOfDate: Date | null;
  bloodGroup: BloodGroup | null;
  maritalStatus: MaritalStatus | null;
  nationality: string | null;
  countryCode: string | null;
  mobile: string | null;
  mobileNormalized: string | null;
  alternateMobile: string | null;
  alternateMobileNormalized: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  nationalId: string | null;
  nationalIdNormalized: string | null;
  passportNumber: string | null;
  passportNumberNormalized: string | null;
  occupation: string | null;
  religion: string | null;
  notes: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianMobile: string | null;
  guardianMobileNormalized: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactMobile: string | null;
  emergencyContactMobileNormalized: string | null;
  fullName: string;
  overrideDuplicateWarning: boolean;
};

const GENDERS: PatientGender[] = ["MALE", "FEMALE", "OTHER", "UNKNOWN"];
const BLOOD_GROUPS: BloodGroup[] = [
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
const MARITAL_STATUSES: MaritalStatus[] = [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
  "UNKNOWN",
];

function parseEnum<T extends string>(value: string, allowed: T[]): T | null {
  const normalized = value.trim().toUpperCase() as T;
  return allowed.includes(normalized) ? normalized : null;
}

function parseOptionalDate(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function parsePatientFormData(
  formData: FormData,
): PatientFormInput | { errorCode: string } {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const middleName = String(formData.get("middleName") ?? "").trim() || null;
  const lastName = String(formData.get("lastName") ?? "").trim() || null;
  const preferredName = String(formData.get("preferredName") ?? "").trim() || null;
  const gender = parseEnum(String(formData.get("gender") ?? "UNKNOWN"), GENDERS) ?? "UNKNOWN";
  const dobRaw = String(formData.get("dateOfBirth") ?? "").trim();
  const estimatedAgeRaw = String(formData.get("estimatedAge") ?? "").trim();
  const useEstimatedAge = String(formData.get("useEstimatedAge") ?? "") === "true";

  if (!firstName) {
    return { errorCode: PATIENT_ERROR_CODES.PATIENT_VALIDATION };
  }

  let dateOfBirth: Date | null = null;
  let estimatedAge: number | null = null;
  let ageAsOfDate: Date | null = null;

  if (useEstimatedAge) {
    if (!estimatedAgeRaw) {
      return { errorCode: PATIENT_ERROR_CODES.PATIENT_INVALID_AGE };
    }
    estimatedAge = Number.parseInt(estimatedAgeRaw, 10);
    if (
      Number.isNaN(estimatedAge) ||
      estimatedAge < MIN_ESTIMATED_AGE ||
      estimatedAge > MAX_ESTIMATED_AGE
    ) {
      return { errorCode: PATIENT_ERROR_CODES.PATIENT_INVALID_AGE };
    }
    ageAsOfDate = new Date();
    ageAsOfDate.setHours(0, 0, 0, 0);
  } else if (dobRaw) {
    dateOfBirth = parseOptionalDate(dobRaw);
    if (!dateOfBirth) {
      return { errorCode: PATIENT_ERROR_CODES.PATIENT_INVALID_DOB };
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateOfBirth > today) {
      return { errorCode: PATIENT_ERROR_CODES.PATIENT_INVALID_DOB };
    }
  }

  const mobileRaw = String(formData.get("mobile") ?? "").trim() || null;
  const alternateMobileRaw = String(formData.get("alternateMobile") ?? "").trim() || null;
  const emailRaw = String(formData.get("email") ?? "").trim() || null;
  const nationalIdRaw = String(formData.get("nationalId") ?? "").trim() || null;
  const passportRaw = String(formData.get("passportNumber") ?? "").trim() || null;
  const guardianMobileRaw = String(formData.get("guardianMobile") ?? "").trim() || null;
  const emergencyMobileRaw = String(formData.get("emergencyContactMobile") ?? "").trim() || null;

  const mobile = mobileRaw;
  const mobileNormalized = mobileRaw ? normalizeMobile(mobileRaw) : null;
  if (mobileRaw && !mobileNormalized) {
    return { errorCode: PATIENT_ERROR_CODES.PATIENT_INVALID_MOBILE };
  }

  const alternateMobileNormalized = alternateMobileRaw
    ? normalizeMobile(alternateMobileRaw)
    : null;
  if (alternateMobileRaw && !alternateMobileNormalized) {
    return { errorCode: PATIENT_ERROR_CODES.PATIENT_INVALID_MOBILE };
  }

  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) {
    return { errorCode: PATIENT_ERROR_CODES.PATIENT_VALIDATION };
  }

  const nationalId = nationalIdRaw;
  const nationalIdNormalized = nationalIdRaw ? normalizeNationalId(nationalIdRaw) : null;
  const passportNumber = passportRaw;
  const passportNumberNormalized = passportRaw ? normalizePassport(passportRaw) : null;

  const guardianMobileNormalized = guardianMobileRaw
    ? normalizeMobile(guardianMobileRaw)
    : null;
  if (guardianMobileRaw && !guardianMobileNormalized) {
    return { errorCode: PATIENT_ERROR_CODES.PATIENT_INVALID_MOBILE };
  }

  const emergencyContactMobileNormalized = emergencyMobileRaw
    ? normalizeMobile(emergencyMobileRaw)
    : null;
  if (emergencyMobileRaw && !emergencyContactMobileNormalized) {
    return { errorCode: PATIENT_ERROR_CODES.PATIENT_INVALID_MOBILE };
  }

  const bloodGroupRaw = String(formData.get("bloodGroup") ?? "").trim();
  const maritalStatusRaw = String(formData.get("maritalStatus") ?? "").trim();

  return {
    firstName,
    middleName,
    lastName,
    preferredName,
    gender,
    dateOfBirth,
    estimatedAge,
    ageAsOfDate,
    bloodGroup: bloodGroupRaw ? parseEnum(bloodGroupRaw, BLOOD_GROUPS) : null,
    maritalStatus: maritalStatusRaw ? parseEnum(maritalStatusRaw, MARITAL_STATUSES) : null,
    nationality: String(formData.get("nationality") ?? "").trim() || null,
    countryCode: String(formData.get("countryCode") ?? "").trim().toUpperCase() || null,
    mobile,
    mobileNormalized,
    alternateMobile: alternateMobileRaw,
    alternateMobileNormalized,
    email,
    addressLine1: String(formData.get("addressLine1") ?? "").trim() || null,
    addressLine2: String(formData.get("addressLine2") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    district: String(formData.get("district") ?? "").trim() || null,
    postalCode: String(formData.get("postalCode") ?? "").trim() || null,
    nationalId,
    nationalIdNormalized,
    passportNumber,
    passportNumberNormalized,
    occupation: String(formData.get("occupation") ?? "").trim() || null,
    religion: String(formData.get("religion") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    guardianName: String(formData.get("guardianName") ?? "").trim() || null,
    guardianRelation: String(formData.get("guardianRelation") ?? "").trim() || null,
    guardianMobile: guardianMobileRaw,
    guardianMobileNormalized,
    emergencyContactName: String(formData.get("emergencyContactName") ?? "").trim() || null,
    emergencyContactRelation:
      String(formData.get("emergencyContactRelation") ?? "").trim() || null,
    emergencyContactMobile: emergencyMobileRaw,
    emergencyContactMobileNormalized,
    fullName: buildFullName(firstName, middleName, lastName),
    overrideDuplicateWarning: String(formData.get("overrideDuplicateWarning") ?? "") === "true",
  };
}

export function patientDataFromInput(input: PatientFormInput) {
  return {
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    fullName: input.fullName,
    preferredName: input.preferredName,
    gender: input.gender,
    dateOfBirth: input.dateOfBirth,
    estimatedAge: input.estimatedAge,
    ageAsOfDate: input.ageAsOfDate,
    bloodGroup: input.bloodGroup,
    maritalStatus: input.maritalStatus,
    nationality: input.nationality,
    countryCode: input.countryCode,
    mobile: input.mobile,
    mobileNormalized: input.mobileNormalized,
    alternateMobile: input.alternateMobile,
    alternateMobileNormalized: input.alternateMobileNormalized,
    email: input.email,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    city: input.city,
    district: input.district,
    postalCode: input.postalCode,
    nationalId: input.nationalId,
    nationalIdNormalized: input.nationalIdNormalized,
    passportNumber: input.passportNumber,
    passportNumberNormalized: input.passportNumberNormalized,
    occupation: input.occupation,
    religion: input.religion,
    notes: input.notes,
    guardianName: input.guardianName,
    guardianRelation: input.guardianRelation,
    guardianMobile: input.guardianMobile,
    guardianMobileNormalized: input.guardianMobileNormalized,
    emergencyContactName: input.emergencyContactName,
    emergencyContactRelation: input.emergencyContactRelation,
    emergencyContactMobile: input.emergencyContactMobile,
    emergencyContactMobileNormalized: input.emergencyContactMobileNormalized,
  };
}
