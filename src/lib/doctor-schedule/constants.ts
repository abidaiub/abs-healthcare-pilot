/** MOD-17 DoctorSchedule.DayOfWeek — 0:Sun to 6:Sat, matching `Date.getDay()`. */
export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_OF_WEEK_I18N_KEYS: Record<DayOfWeek, string> = {
  0: "doctorSchedule.days.sunday",
  1: "doctorSchedule.days.monday",
  2: "doctorSchedule.days.tuesday",
  3: "doctorSchedule.days.wednesday",
  4: "doctorSchedule.days.thursday",
  5: "doctorSchedule.days.friday",
  6: "doctorSchedule.days.saturday",
};

export const SLOT_DURATION_OPTIONS = [10, 15, 20, 30, 45, 60] as const;

export const MIN_SLOT_DURATION_MINUTES = 5;
export const MAX_SLOT_DURATION_MINUTES = 240;

/** Guards against generating an unbounded slot list from a malformed shift. */
export const MAX_SLOTS_PER_SHIFT = 96;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeOfDay(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function timeToMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Expands one shift row into its bookable start times. A slot is only produced when the
 * whole slot fits inside the shift, so a 09:00-13:00 / 30 min shift ends at 12:30.
 */
export function generateShiftSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
): string[] {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null) return [];
  if (slotDuration < MIN_SLOT_DURATION_MINUTES || end <= start) return [];

  const slots: string[] = [];
  for (let cursor = start; cursor + slotDuration <= end; cursor += slotDuration) {
    slots.push(minutesToTime(cursor));
    if (slots.length >= MAX_SLOTS_PER_SHIFT) break;
  }
  return slots;
}

export function shiftsOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;
  return aStart < bEnd && bStart < aEnd;
}

export function dayOfWeekFromDate(date: Date): DayOfWeek {
  return date.getUTCDay() as DayOfWeek;
}
