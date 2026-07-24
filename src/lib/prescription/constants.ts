import type { PrescriptionStatus } from "@/generated/prisma/client";

export const PRESCRIPTION_STATUSES: PrescriptionStatus[] = [
  "DRAFT",
  "FINALIZED",
  "CANCELLED",
  "SUPERSEDED",
];

export const PRESCRIPTION_STATUS_I18N_KEYS: Record<PrescriptionStatus, string> = {
  DRAFT: "prescription.status.draft",
  FINALIZED: "prescription.status.finalized",
  CANCELLED: "prescription.status.cancelled",
  SUPERSEDED: "prescription.status.superseded",
};

export const STRUCTURED_FREQUENCIES = ["OD", "BID", "TID", "QID", "HS", "PRN", "STAT"] as const;

export const FREQUENCY_I18N_KEYS: Record<(typeof STRUCTURED_FREQUENCIES)[number], string> = {
  OD: "prescription.frequency.od",
  BID: "prescription.frequency.bid",
  TID: "prescription.frequency.tid",
  QID: "prescription.frequency.qid",
  HS: "prescription.frequency.hs",
  PRN: "prescription.frequency.prn",
  STAT: "prescription.frequency.stat",
};

export const STATUS_TRANSITIONS: Partial<Record<PrescriptionStatus, PrescriptionStatus[]>> = {
  DRAFT: ["FINALIZED", "CANCELLED"],
  FINALIZED: ["SUPERSEDED", "CANCELLED"],
};

export function canTransitionPrescriptionStatus(
  from: PrescriptionStatus,
  to: PrescriptionStatus,
): boolean {
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isPrescriptionEditable(status: PrescriptionStatus): boolean {
  return status === "DRAFT";
}

export function formatPrescriptionNumber(sequence: number): string {
  return `RX-${String(sequence).padStart(6, "0")}`;
}

export function calculateQuantityFromStructured(input: {
  frequency?: string | null;
  durationValue?: number | null;
  durationUnit?: string | null;
}): string | null {
  const freq = input.frequency?.toUpperCase();
  const perDay =
    freq === "OD" ? 1 :
    freq === "BID" ? 2 :
    freq === "TID" ? 3 :
    freq === "QID" ? 4 :
    null;
  if (!perDay || !input.durationValue || input.durationValue < 1) return null;
  const days =
    input.durationUnit === "WEEK" ? input.durationValue * 7 :
    input.durationUnit === "MONTH" ? input.durationValue * 30 :
    input.durationUnit === "DAY" ? input.durationValue :
    null;
  if (!days) return null;
  return String(perDay * days);
}
