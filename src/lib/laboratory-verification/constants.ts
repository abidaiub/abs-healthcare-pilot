import type { LabCorrectionRequestStatus, LabResultStatus } from "@/generated/prisma/client";

export const REJECTION_REASON_CODES = [
  "VALUE_RECHECK_REQUIRED",
  "UNIT_INCORRECT",
  "REFERENCE_RANGE_REVIEW",
  "MISSING_RESULT",
  "INCONSISTENT_RESULT",
  "SPECIMEN_CONCERN",
  "TECHNICAL_ERROR",
  "CRITICAL_VALUE_REVIEW",
  "CLINICAL_CORRELATION_REQUIRED",
  "OTHER",
] as const;

export type RejectionReasonCode = (typeof REJECTION_REASON_CODES)[number];

export const REJECTION_REASON_I18N: Record<RejectionReasonCode, string> = {
  VALUE_RECHECK_REQUIRED: "laboratoryVerification.rejectionReason.valueRecheckRequired",
  UNIT_INCORRECT: "laboratoryVerification.rejectionReason.unitIncorrect",
  REFERENCE_RANGE_REVIEW: "laboratoryVerification.rejectionReason.referenceRangeReview",
  MISSING_RESULT: "laboratoryVerification.rejectionReason.missingResult",
  INCONSISTENT_RESULT: "laboratoryVerification.rejectionReason.inconsistentResult",
  SPECIMEN_CONCERN: "laboratoryVerification.rejectionReason.specimenConcern",
  TECHNICAL_ERROR: "laboratoryVerification.rejectionReason.technicalError",
  CRITICAL_VALUE_REVIEW: "laboratoryVerification.rejectionReason.criticalValueReview",
  CLINICAL_CORRELATION_REQUIRED: "laboratoryVerification.rejectionReason.clinicalCorrelationRequired",
  OTHER: "laboratoryVerification.rejectionReason.other",
};

export const VERIFICATION_DECISION_I18N = {
  VERIFIED: "laboratoryVerification.decision.verified",
  REJECTED_FOR_CORRECTION: "laboratoryVerification.decision.rejectedForCorrection",
} as const;

export const CORRECTION_STATUS_I18N: Record<LabCorrectionRequestStatus, string> = {
  OPEN: "laboratoryVerification.correctionStatus.open",
  IN_PROGRESS: "laboratoryVerification.correctionStatus.inProgress",
  RESUBMITTED: "laboratoryVerification.correctionStatus.resubmitted",
  RESOLVED: "laboratoryVerification.correctionStatus.resolved",
  CANCELLED: "laboratoryVerification.correctionStatus.cancelled",
};

export function isResultReadyForVerification(status: LabResultStatus): boolean {
  return status === "READY_FOR_VERIFICATION";
}

export function isResultLocked(status: LabResultStatus): boolean {
  return status === "VERIFIED";
}

export function isResultCorrectable(status: LabResultStatus): boolean {
  return status === "REJECTED_FOR_CORRECTION" || status === "IN_PROGRESS";
}

export function canStartCorrection(status: LabCorrectionRequestStatus): boolean {
  return status === "OPEN" || status === "IN_PROGRESS";
}
