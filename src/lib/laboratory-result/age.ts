/**
 * Patient age in whole days at reference date.
 * Rule: use sample collection time when available; otherwise result-entry time.
 *
 * Architecture seed convention uses 365 days/year (adult boundary = 18 × 365 = 6570).
 */
export const DAYS_PER_YEAR = 365;

export function calculateAgeInDays(dateOfBirth: Date, referenceDate: Date): number {
  const start = startOfUtcDay(dateOfBirth);
  const end = startOfUtcDay(referenceDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

/**
 * When date of birth is absent, derive age-in-days from estimated age years so
 * adult/paediatric reference ranges still resolve (Architecture §6.3).
 */
export function estimateAgeInDays(
  estimatedAgeYears: number,
  ageAsOfDate: Date | null | undefined,
  referenceDate: Date,
): number {
  const baseDays = Math.max(0, Math.floor(estimatedAgeYears * DAYS_PER_YEAR));
  if (!ageAsOfDate) return baseDays;
  const asOf = startOfUtcDay(ageAsOfDate);
  const ref = startOfUtcDay(referenceDate);
  const elapsedDays = Math.floor((ref.getTime() - asOf.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, baseDays + elapsedDays);
}

export function resolvePatientAgeInDays(input: {
  dateOfBirth: Date | null | undefined;
  estimatedAge: number | null | undefined;
  ageAsOfDate: Date | null | undefined;
  referenceDate: Date;
}): number | null {
  if (input.dateOfBirth) {
    return calculateAgeInDays(input.dateOfBirth, input.referenceDate);
  }
  if (input.estimatedAge != null) {
    return estimateAgeInDays(input.estimatedAge, input.ageAsOfDate, input.referenceDate);
  }
  return null;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function normalizePatientGender(gender: string | null | undefined): string | null {
  if (!gender) return null;
  const normalized = gender.trim().toUpperCase();
  if (normalized === "M" || normalized === "MALE") return "M";
  if (normalized === "F" || normalized === "FEMALE") return "F";
  return normalized;
}
