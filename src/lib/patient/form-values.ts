import type { PatientFormValues } from "@/components/patients/PatientForm";

type PatientFormRecord = {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  preferredName: string | null;
  gender: string;
  dateOfBirth: Date | null;
  estimatedAge: number | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  countryCode: string | null;
  mobile: string | null;
  alternateMobile: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  nationalId: string | null;
  passportNumber: string | null;
  occupation: string | null;
  religion: string | null;
  notes: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianMobile: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactMobile: string | null;
};

export function patientRecordToFormValues(patient: PatientFormRecord): Partial<PatientFormValues> {
  return {
    firstName: patient.firstName,
    middleName: patient.middleName ?? "",
    lastName: patient.lastName ?? "",
    preferredName: patient.preferredName ?? "",
    gender: patient.gender,
    dateOfBirth: patient.dateOfBirth?.toISOString().slice(0, 10) ?? "",
    estimatedAge: patient.estimatedAge != null ? String(patient.estimatedAge) : "",
    useEstimatedAge: patient.dateOfBirth == null && patient.estimatedAge != null,
    bloodGroup: patient.bloodGroup ?? "",
    maritalStatus: patient.maritalStatus ?? "",
    nationality: patient.nationality ?? "",
    countryCode: patient.countryCode ?? "BD",
    mobile: patient.mobile ?? "",
    alternateMobile: patient.alternateMobile ?? "",
    email: patient.email ?? "",
    addressLine1: patient.addressLine1 ?? "",
    addressLine2: patient.addressLine2 ?? "",
    city: patient.city ?? "",
    district: patient.district ?? "",
    postalCode: patient.postalCode ?? "",
    nationalId: patient.nationalId ?? "",
    passportNumber: patient.passportNumber ?? "",
    occupation: patient.occupation ?? "",
    religion: patient.religion ?? "",
    notes: patient.notes ?? "",
    guardianName: patient.guardianName ?? "",
    guardianRelation: patient.guardianRelation ?? "",
    guardianMobile: patient.guardianMobile ?? "",
    emergencyContactName: patient.emergencyContactName ?? "",
    emergencyContactRelation: patient.emergencyContactRelation ?? "",
    emergencyContactMobile: patient.emergencyContactMobile ?? "",
  };
}
