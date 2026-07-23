export function normalizeMobile(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  let raw = value.trim().replace(/[\s\-()]/g, "");
  if (raw.startsWith("00")) {
    raw = `+${raw.slice(2)}`;
  }
  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return null;
    return digits;
  }
  if (raw.startsWith("0") && raw.length >= 10) {
    const digits = `880${raw.slice(1).replace(/\D/g, "")}`;
    return digits.length >= 12 ? digits : null;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function normalizeNationalId(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().replace(/[\s\-]/g, "").toUpperCase();
  return normalized.length >= 4 ? normalized : null;
}

export function normalizePassport(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().replace(/\s+/g, "").toUpperCase();
  return normalized.length >= 4 ? normalized : null;
}

export function buildFullName(
  firstName: string,
  middleName?: string | null,
  lastName?: string | null,
): string {
  return [firstName.trim(), middleName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
}

export function calculateAgeFromDob(dateOfBirth: Date, asOf: Date = new Date()): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = asOf.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

export function calculateEstimatedAge(
  estimatedAge: number,
  ageAsOfDate: Date,
  asOf: Date = new Date(),
): number {
  const yearsElapsed = asOf.getFullYear() - ageAsOfDate.getFullYear();
  return estimatedAge + Math.max(0, yearsElapsed);
}

export function formatPatientNumber(sequence: number): string {
  return `PT-${String(sequence).padStart(6, "0")}`;
}

export function formatPatientDisplayAge(patient: {
  dateOfBirth: Date | null;
  estimatedAge: number | null;
  ageAsOfDate: Date | null;
}): string {
  if (patient.dateOfBirth) {
    return String(calculateAgeFromDob(patient.dateOfBirth));
  }
  if (patient.estimatedAge != null && patient.ageAsOfDate) {
    return String(calculateEstimatedAge(patient.estimatedAge, patient.ageAsOfDate));
  }
  if (patient.estimatedAge != null) {
    return String(patient.estimatedAge);
  }
  return "—";
}
