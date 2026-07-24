import type { ClinicalEncounterStatus } from "@/generated/prisma/client";

export const ENCOUNTER_STATUSES: ClinicalEncounterStatus[] = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export const ENCOUNTER_STATUS_I18N_KEYS: Record<ClinicalEncounterStatus, string> = {
  DRAFT: "consultation.status.draft",
  IN_PROGRESS: "consultation.status.inProgress",
  COMPLETED: "consultation.status.completed",
  CANCELLED: "consultation.status.cancelled",
};

export const STATUS_TRANSITIONS: Partial<
  Record<ClinicalEncounterStatus, ClinicalEncounterStatus[]>
> = {
  DRAFT: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["IN_PROGRESS"],
};

export const EDITABLE_STATUSES: ClinicalEncounterStatus[] = ["DRAFT", "IN_PROGRESS"];

export const APPOINTMENT_START_STATUSES = ["WAITING", "CALLED", "IN_CONSULTATION"] as const;

export function canTransitionEncounterStatus(
  from: ClinicalEncounterStatus,
  to: ClinicalEncounterStatus,
  allowReopen = false,
): boolean {
  if (from === to) return true;
  if (from === "COMPLETED" && to === "IN_PROGRESS") return allowReopen;
  if (from === "CANCELLED") return false;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isEncounterEditable(status: ClinicalEncounterStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function formatEncounterNumber(sequence: number): string {
  return `EN-${String(sequence).padStart(6, "0")}`;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calculateBmi(heightCm: number, weightKg: number): number | null {
  if (heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 100) / 100;
}
