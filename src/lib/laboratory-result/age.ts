/**
 * Patient age in whole days at reference date.
 * Rule: use sample collection time when available; otherwise result-entry time.
 */
export function calculateAgeInDays(dateOfBirth: Date, referenceDate: Date): number {
  const start = startOfUtcDay(dateOfBirth);
  const end = startOfUtcDay(referenceDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
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
