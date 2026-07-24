import type { LabReportReleaseStatus, LabResultStatus } from "@/generated/prisma/client";

export const LAB_REPORT_NUMBER_PREFIX = "RPT";
export const LAB_REPORT_CODE_PAD = 7;

export function formatReportNumber(sequence: number): string {
  return `${LAB_REPORT_NUMBER_PREFIX}-${String(sequence).padStart(LAB_REPORT_CODE_PAD, "0")}`;
}

export function isValidReportNumber(value: string): boolean {
  return /^RPT-\d{7}$/.test(value);
}

export const RELEASE_STATUS_I18N: Record<LabReportReleaseStatus, string> = {
  RELEASE_PENDING: "laboratoryReportRelease.status.releasePending",
  RELEASED: "laboratoryReportRelease.status.released",
  WITHDRAWN: "laboratoryReportRelease.status.withdrawn",
  AMENDED: "laboratoryReportRelease.status.amended",
};

export const RESULT_RELEASE_ELIGIBLE_STATUSES: LabResultStatus[] = ["VERIFIED"];

export function isResultEligibleForReleaseQueue(status: LabResultStatus): boolean {
  return status === "VERIFIED";
}

export function isReleaseAuthorizable(releaseStatus: LabReportReleaseStatus): boolean {
  return releaseStatus === "RELEASE_PENDING" || releaseStatus === "AMENDED";
}

export function isReleaseWithdrawable(releaseStatus: LabReportReleaseStatus): boolean {
  return releaseStatus === "RELEASED";
}

export function isReleaseAmendable(releaseStatus: LabReportReleaseStatus): boolean {
  return releaseStatus === "RELEASED";
}

export function isReleasePrintable(releaseStatus: LabReportReleaseStatus): boolean {
  return releaseStatus === "RELEASED";
}
