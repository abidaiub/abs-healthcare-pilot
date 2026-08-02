import type { LabReportReleaseStatus } from "@/generated/prisma/client";
import { isResultEligibleForReleaseQueue } from "@/lib/laboratory-report-release/constants";
import { LAB_REPORT_RELEASE_ERROR_CODES } from "@/lib/laboratory-report-release/errors";
import type { ReportReleasePolicy } from "@/lib/laboratory-report-release/policy";
import type { ReleaseResultPayload } from "@/lib/laboratory-report-release/snapshot";
import type { ReportReleaseEligibility } from "@/lib/laboratory-report-release/types";

export type EvaluateReportReleaseEligibilityInput = {
  tenantId: string;
  branchId?: string;
  result: ReleaseResultPayload | null;
  release?: {
    id: string;
    status: LabReportReleaseStatus;
    stateVersion: number;
    resultVersionSnapshot: number;
    billingHoldActive: boolean;
    qualityHoldActive: boolean;
  } | null;
  expectedRecordVersion?: number;
  expectedStateVersion?: number;
  policy: ReportReleasePolicy;
  hasPermission?: boolean;
  phase: "prepare" | "authorize" | "print" | "portal";
};

function block(
  eligibility: ReportReleaseEligibility,
  code: string,
  messageKey: string,
  category: ReportReleaseEligibility["blockingReasons"][number]["category"],
) {
  eligibility.eligible = false;
  eligibility.blockingReasons.push({ code, messageKey, category });
}

export function evaluateReportReleaseEligibility(
  input: EvaluateReportReleaseEligibilityInput,
): ReportReleaseEligibility {
  const eligibility: ReportReleaseEligibility = {
    eligible: true,
    blockingReasons: [],
    warnings: [],
  };

  if (input.hasPermission === false) {
    block(
      eligibility,
      LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_ACCESS_DENIED,
      "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_ACCESS_DENIED",
      "SECURITY",
    );
    return eligibility;
  }

  if (!input.result) {
    block(
      eligibility,
      LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_FOUND,
      "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_NOT_FOUND",
      "CLINICAL",
    );
    return eligibility;
  }

  if (input.result.tenantId !== input.tenantId) {
    block(
      eligibility,
      LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_CROSS_TENANT,
      "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_CROSS_TENANT",
      "SECURITY",
    );
  }

  if (input.branchId && input.result.branchId !== input.branchId) {
    block(
      eligibility,
      LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED,
      "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED",
      "SECURITY",
    );
  }

  if (!isResultEligibleForReleaseQueue(input.result.status)) {
    block(
      eligibility,
      LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_RESULT_NOT_VERIFIED,
      "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_RESULT_NOT_VERIFIED",
      "CLINICAL",
    );
  }

  const openCorrection = input.result.correctionRequests.some((request) =>
    ["OPEN", "IN_PROGRESS"].includes(request.status),
  );
  if (openCorrection) {
    block(
      eligibility,
      LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_CORRECTION_PENDING,
      "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_CORRECTION_PENDING",
      "CLINICAL",
    );
  }

  const latestVerification = input.result.verifications.find((entry) => entry.decision === "VERIFIED");
  if (!latestVerification?.verifiedAt) {
    block(
      eligibility,
      LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_RESULT_NOT_VERIFIED,
      "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_RESULT_NOT_VERIFIED",
      "CLINICAL",
    );
  }

  // Verify persists resultVersionReviewed for the content version reviewed, then
  // increments LabResult.recordVersion. Treat reviewed == current OR reviewed == current-1
  // (post-verify) as aligned so release is not blocked by the version bump alone.
  const reviewedVersion = latestVerification?.resultVersionReviewed;
  const currentVersion = input.result.recordVersion;
  const reviewedAligned =
    reviewedVersion == null ||
    reviewedVersion === currentVersion ||
    (input.result.status === "VERIFIED" && reviewedVersion === currentVersion - 1);
  const expectedAligned =
    input.expectedRecordVersion == null || input.expectedRecordVersion === currentVersion;

  if (latestVerification && (!reviewedAligned || !expectedAligned)) {
    block(
      eligibility,
      LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERSION_MISMATCH,
      "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_VERSION_MISMATCH",
      "CLINICAL",
    );
  }

  if (input.release) {
    if (input.release.status === "WITHDRAWN") {
      block(
        eligibility,
        LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_INVALID_STATUS,
        "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_INVALID_STATUS",
        "CLINICAL",
      );
    }

    if (input.phase === "prepare" && input.release.status === "RELEASED") {
      block(
        eligibility,
        LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_ALREADY_RELEASED,
        "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_ALREADY_RELEASED",
        "CONCURRENCY",
      );
    }

    if (input.phase === "authorize" && !["RELEASE_PENDING", "AMENDED"].includes(input.release.status)) {
      if (input.release.status === "RELEASED") {
        block(
          eligibility,
          LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_ALREADY_AUTHORIZED,
          "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_ALREADY_AUTHORIZED",
          "CONCURRENCY",
        );
      } else {
        block(
          eligibility,
          LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_INVALID_STATUS,
          "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_INVALID_STATUS",
          "CLINICAL",
        );
      }
    }

    if (
      input.expectedStateVersion != null &&
      input.expectedStateVersion !== input.release.stateVersion
    ) {
      block(
        eligibility,
        LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_STATE_CHANGED,
        "laboratoryReportRelease.errors.REPORT_RELEASE_STATE_CHANGED",
        "CONCURRENCY",
      );
    }

    if (input.release.resultVersionSnapshot !== input.result.recordVersion && input.phase !== "prepare") {
      block(
        eligibility,
        LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_VERSION_CONFLICT,
        "laboratoryReportRelease.errors.REPORT_RELEASE_VERSION_CONFLICT",
        "CONCURRENCY",
      );
    }

    if (input.policy.enforceBillingClearance && input.release.billingHoldActive) {
      block(
        eligibility,
        LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_BLOCKED_BILLING_HOLD,
        "laboratoryReportRelease.errors.REPORT_RELEASE_BLOCKED_BILLING_HOLD",
        "BILLING",
      );
    }

    if (input.release.qualityHoldActive) {
      block(
        eligibility,
        LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_BLOCKED_QUALITY_HOLD,
        "laboratoryReportRelease.errors.REPORT_RELEASE_BLOCKED_QUALITY_HOLD",
        "QUALITY",
      );
    }
  }

  if (input.policy.enforceCriticalAcknowledgement) {
    const pendingCritical = input.result.criticalEvents.some((event) => !event.acknowledgedAt);
    if (pendingCritical) {
      block(
        eligibility,
        LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_BLOCKED_CRITICAL_ACK_PENDING,
        "laboratoryReportRelease.errors.REPORT_RELEASE_BLOCKED_CRITICAL_ACK_PENDING",
        "CRITICAL",
      );
    }
  }

  if (input.phase === "print" || input.phase === "portal") {
    if (!input.release || input.release.status !== "RELEASED") {
      block(
        eligibility,
        LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_NOT_RELEASED,
        "laboratoryReportRelease.errors.LAB_REPORT_RELEASE_NOT_RELEASED",
        "CLINICAL",
      );
    }
  }

  if (eligibility.blockingReasons.length === 0 && input.policy.enforceQualityClearance && !input.release?.qualityHoldActive) {
    eligibility.warnings.push({
      code: "LAB_REPORT_RELEASE_QUALITY_POLICY_ENABLED",
      messageKey: "laboratoryReportRelease.warnings.qualityPolicyEnabled",
    });
  }

  return eligibility;
}

export function firstBlockingErrorCode(eligibility: ReportReleaseEligibility): string | null {
  return eligibility.blockingReasons[0]?.code ?? null;
}

/** @deprecated Use evaluateReportReleaseEligibility for structured results. */
export function assertReleaseEligibility(input: {
  result: ReleaseResultPayload;
  branchId?: string;
  expectedRecordVersion?: number;
}): string | null {
  const eligibility = evaluateReportReleaseEligibility({
    tenantId: input.result.tenantId,
    branchId: input.branchId,
    result: input.result,
    expectedRecordVersion: input.expectedRecordVersion,
    policy: {
      enforceBillingClearance: false,
      enforceQualityClearance: false,
      enforceCriticalAcknowledgement: false,
    },
    phase: "prepare",
  });
  return firstBlockingErrorCode(eligibility);
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
