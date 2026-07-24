import type { LabReportReleaseStatus, LabResultStatus } from "@/generated/prisma/client";
import { isResultEligibleForReleaseQueue } from "@/lib/laboratory-report-release/constants";
import { LAB_REPORT_RELEASE_ERROR_CODES } from "@/lib/laboratory-report-release/errors";
import type { ReleaseResultPayload } from "@/lib/laboratory-report-release/snapshot";

export function assertReleaseEligibility(input: {
  result: ReleaseResultPayload;
  branchId?: string;
  expectedRecordVersion?: number;
}): string | null {
  if (input.branchId && input.result.branchId !== input.branchId) {
    return LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED;
  }

  if (!isResultEligibleForReleaseQueue(input.result.status as LabResultStatus) && input.result.status !== "RELEASED") {
    if (input.result.status === "RELEASE_PENDING") {
      return null;
    }
    return LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_RESULT_NOT_VERIFIED;
  }

  const openCorrection = input.result.correctionRequests.some((request) =>
    ["OPEN", "IN_PROGRESS"].includes(request.status),
  );
  if (openCorrection) {
    return LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_CORRECTION_PENDING;
  }

  const latestVerification = input.result.verifications.find((entry) => entry.decision === "VERIFIED");
  if (!latestVerification?.verifiedAt) {
    return LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_RESULT_NOT_VERIFIED;
  }

  if (
    latestVerification.resultVersionReviewed !== input.result.recordVersion ||
    (input.expectedRecordVersion != null && input.expectedRecordVersion !== input.result.recordVersion)
  ) {
    return LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERSION_MISMATCH;
  }

  return null;
}

export function assertReleaseStatus(
  status: LabReportReleaseStatus,
  allowed: LabReportReleaseStatus[],
): string | null {
  if (!allowed.includes(status)) {
    return LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_INVALID_STATUS;
  }
  return null;
}
