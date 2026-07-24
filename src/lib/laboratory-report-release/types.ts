export type ReportReleaseBlockingCategory =
  | "CLINICAL"
  | "BILLING"
  | "QUALITY"
  | "CRITICAL"
  | "SECURITY"
  | "CONCURRENCY";

export type ReportReleaseEligibility = {
  eligible: boolean;
  blockingReasons: Array<{
    code: string;
    messageKey: string;
    category: ReportReleaseBlockingCategory;
  }>;
  warnings: Array<{
    code: string;
    messageKey: string;
  }>;
};
