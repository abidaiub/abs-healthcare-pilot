import type { AppointmentStatus, AppointmentType } from "@/generated/prisma/client";

export const APPOINTMENT_TYPES: AppointmentType[] = ["WALK_IN", "SCHEDULED"];

export const APPOINTMENT_TYPE_I18N_KEYS: Record<AppointmentType, string> = {
  WALK_IN: "appointment.types.walkIn",
  SCHEDULED: "appointment.types.scheduled",
};

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "SCHEDULED",
  "CHECKED_IN",
  "WAITING",
  "CALLED",
  "IN_CONSULTATION",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export const APPOINTMENT_STATUS_I18N_KEYS: Record<AppointmentStatus, string> = {
  SCHEDULED: "appointment.status.scheduled",
  CHECKED_IN: "appointment.status.checkedIn",
  WAITING: "appointment.status.waiting",
  CALLED: "appointment.status.called",
  IN_CONSULTATION: "appointment.status.inConsultation",
  COMPLETED: "appointment.status.completed",
  CANCELLED: "appointment.status.cancelled",
  NO_SHOW: "appointment.status.noShow",
};

export const QUEUE_ACTIVE_STATUSES: AppointmentStatus[] = [
  "CHECKED_IN",
  "WAITING",
  "CALLED",
  "IN_CONSULTATION",
];

export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
] as const;

export const TERMINAL_STATUSES: AppointmentStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

export const STATUS_TRANSITIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  SCHEDULED: ["CHECKED_IN", "WAITING", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["WAITING", "CANCELLED"],
  WAITING: ["CALLED", "CANCELLED", "NO_SHOW"],
  CALLED: ["IN_CONSULTATION", "WAITING", "CANCELLED", "NO_SHOW"],
  IN_CONSULTATION: ["COMPLETED", "CANCELLED"],
};

export function canTransitionStatus(from: AppointmentStatus, to: AppointmentStatus): boolean {
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatAppointmentNumber(sequence: number): string {
  return `AP-${String(sequence).padStart(6, "0")}`;
}
