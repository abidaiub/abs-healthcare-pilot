import type {
  LabOrderPriority,
  LabOrderSource,
  LabOrderStatus,
  LabOrderTestStatus,
  LabSampleStatus,
} from "@/generated/prisma/client";

export const LAB_ORDER_CODE_PREFIX = "LAB";
export const LAB_ACCESSION_PREFIX = "ACC";
export const CODE_PAD = 6;

export function formatLabOrderNumber(sequence: number): string {
  return `${LAB_ORDER_CODE_PREFIX}-${String(sequence).padStart(CODE_PAD, "0")}`;
}

export function formatAccessionNumber(sequence: number): string {
  return `${LAB_ACCESSION_PREFIX}-${String(sequence).padStart(CODE_PAD, "0")}`;
}

export function isValidLabOrderNumber(value: string): boolean {
  return /^LAB-\d{6}$/.test(value);
}

export function isValidAccessionNumber(value: string): boolean {
  return /^ACC-\d{6}$/.test(value);
}

export const LAB_ORDER_STATUS_I18N: Record<LabOrderStatus, string> = {
  DRAFT: "laboratory.orderStatus.draft",
  CONFIRMED: "laboratory.orderStatus.confirmed",
  PARTIALLY_COLLECTED: "laboratory.orderStatus.partiallyCollected",
  COLLECTED: "laboratory.orderStatus.collected",
  RECEIVED: "laboratory.orderStatus.received",
  IN_PROCESS: "laboratory.orderStatus.inProcess",
  READY_FOR_RESULT: "laboratory.orderStatus.readyForResult",
  COMPLETED: "laboratory.orderStatus.completed",
  CANCELLED: "laboratory.orderStatus.cancelled",
};

export const LAB_SAMPLE_STATUS_I18N: Record<LabSampleStatus, string> = {
  PENDING_COLLECTION: "laboratory.sampleStatus.pendingCollection",
  COLLECTED: "laboratory.sampleStatus.collected",
  RECEIVED: "laboratory.sampleStatus.received",
  REJECTED: "laboratory.sampleStatus.rejected",
  IN_PROCESS: "laboratory.sampleStatus.inProcess",
  READY_FOR_RESULT: "laboratory.sampleStatus.readyForResult",
  COMPLETED: "laboratory.sampleStatus.completed",
};

const ORDER_TRANSITIONS: Record<LabOrderStatus, LabOrderStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PARTIALLY_COLLECTED", "COLLECTED", "CANCELLED"],
  PARTIALLY_COLLECTED: ["COLLECTED", "CANCELLED"],
  COLLECTED: ["RECEIVED"],
  RECEIVED: ["IN_PROCESS"],
  IN_PROCESS: ["READY_FOR_RESULT"],
  READY_FOR_RESULT: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionLabOrderStatus(from: LabOrderStatus, to: LabOrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isLabOrderEditable(status: LabOrderStatus): boolean {
  return status === "DRAFT";
}

export function canCancelLabOrder(status: LabOrderStatus): boolean {
  return status === "DRAFT" || status === "CONFIRMED" || status === "PARTIALLY_COLLECTED";
}

export const DEFAULT_REJECTION_REASONS = [
  { reasonCode: "WRONG_CONTAINER", displayName: "Wrong container" },
  { reasonCode: "INSUFFICIENT_VOLUME", displayName: "Insufficient volume" },
  { reasonCode: "HEMOLYZED", displayName: "Hemolyzed sample" },
  { reasonCode: "CLOTTED", displayName: "Clotted sample" },
  { reasonCode: "MISLABELLED", displayName: "Mislabelled sample" },
  { reasonCode: "LEAKING", displayName: "Leaking container" },
  { reasonCode: "CONTAMINATED", displayName: "Contaminated sample" },
  { reasonCode: "DELAYED_TRANSPORT", displayName: "Delayed transport" },
  { reasonCode: "WRONG_TEMPERATURE", displayName: "Wrong temperature" },
  { reasonCode: "PATIENT_MISMATCH", displayName: "Patient mismatch" },
  { reasonCode: "OTHER", displayName: "Other" },
] as const;

export type LabOrderSourceCode = LabOrderSource;
export type LabOrderPriorityCode = LabOrderPriority;
export type LabOrderTestStatusCode = LabOrderTestStatus;
