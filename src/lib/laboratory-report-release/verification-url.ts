/**
 * Builds the public verification URL from trusted server configuration only.
 */
export function buildReportVerificationUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}/verify/report/${encodeURIComponent(token)}`;
}
