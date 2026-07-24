export function normalizeMedicationText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeMedicationCode(value: string): string {
  return value.trim().toUpperCase();
}
