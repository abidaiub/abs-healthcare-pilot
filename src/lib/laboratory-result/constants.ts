import type { LabOrderTestStatus, LabResultStatus } from "@/generated/prisma/client";

export const LAB_RESULT_STATUS_I18N: Record<LabResultStatus, string> = {
  DRAFT: "laboratoryResult.status.draft",
  IN_PROGRESS: "laboratoryResult.status.inProgress",
  ENTRY_COMPLETED: "laboratoryResult.status.entryCompleted",
  READY_FOR_VERIFICATION: "laboratoryResult.status.readyForVerification",
  VERIFIED: "laboratoryResult.status.verified",
  REJECTED_FOR_CORRECTION: "laboratoryResult.status.rejectedForCorrection",
  AMENDED: "laboratoryResult.status.amended",
  CANCELLED: "laboratoryResult.status.cancelled",
};

export const MOD22_OWNED_STATUSES: LabResultStatus[] = [
  "DRAFT",
  "IN_PROGRESS",
  "ENTRY_COMPLETED",
  "READY_FOR_VERIFICATION",
];

const RESULT_TRANSITIONS: Record<LabResultStatus, LabResultStatus[]> = {
  DRAFT: ["IN_PROGRESS", "ENTRY_COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["ENTRY_COMPLETED", "CANCELLED"],
  ENTRY_COMPLETED: ["READY_FOR_VERIFICATION", "IN_PROGRESS"],
  READY_FOR_VERIFICATION: ["IN_PROGRESS"],
  VERIFIED: [],
  REJECTED_FOR_CORRECTION: [],
  AMENDED: [],
  CANCELLED: [],
};

export function canTransitionLabResultStatus(from: LabResultStatus, to: LabResultStatus): boolean {
  return RESULT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isLabResultEditable(status: LabResultStatus): boolean {
  return status === "DRAFT" || status === "IN_PROGRESS" || status === "ENTRY_COMPLETED";
}

export function isLabResultCorrectable(status: LabResultStatus): boolean {
  return status === "REJECTED_FOR_CORRECTION" || status === "IN_PROGRESS";
}

export function canReopenLabResult(status: LabResultStatus): boolean {
  return status === "ENTRY_COMPLETED" || status === "READY_FOR_VERIFICATION";
}

export const RESULT_ENTRY_WORKLIST_TEST_STATUSES: LabOrderTestStatus[] = [
  "READY_FOR_RESULT",
  "RESULT_IN_PROGRESS",
  "READY_FOR_VERIFICATION",
];

export const ABNORMAL_FLAG_I18N = {
  NORMAL: "laboratoryResult.abnormalFlag.normal",
  LOW: "laboratoryResult.abnormalFlag.low",
  HIGH: "laboratoryResult.abnormalFlag.high",
  ABNORMAL: "laboratoryResult.abnormalFlag.abnormal",
  CRITICAL_LOW: "laboratoryResult.abnormalFlag.criticalLow",
  CRITICAL_HIGH: "laboratoryResult.abnormalFlag.criticalHigh",
  NOT_APPLICABLE: "laboratoryResult.abnormalFlag.notApplicable",
  UNDETERMINED: "laboratoryResult.abnormalFlag.undetermined",
} as const;
