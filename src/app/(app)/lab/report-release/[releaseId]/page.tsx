import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ReleaseDetailPanel } from "@/components/laboratory-report-release/ReleaseDetailPanel";
import { getReleaseDetailAction, getReleaseEligibilityAction } from "@/app/actions/tenant-lab-report-release";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";
import { generateQrSvgDataUrl } from "@/lib/laboratory-report-release/qr";
import { parseReportSnapshot } from "@/lib/laboratory-report-release/snapshot";
import { buildReportVerificationUrl } from "@/lib/laboratory-report-release/verification-url";

type PageProps = {
  params: Promise<{ releaseId: string }>;
};

export default async function ReportReleaseDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/report-release");
  const { t } = await getServerI18n(session);
  const { releaseId } = await params;
  const release = await getReleaseDetailAction(releaseId).catch(() => null);
  if (!release) notFound();

  const snapshot = release.currentVersion ? parseReportSnapshot(release.currentVersion.snapshotJson) : null;
  const eligibility = await getReleaseEligibilityAction({
    releaseId,
    recordVersion: release.labResult.recordVersion,
    stateVersion: release.stateVersion,
    phase: release.status === "RELEASED" ? "authorize" : "authorize",
  });

  const token = release.verificationTokens[0]?.token ?? null;
  const verificationUrl = token ? buildReportVerificationUrl(token) : null;
  const qrDataUrl = token ? await generateQrSvgDataUrl(token) : null;

  const [canPrint, canDownload, canPublishPortal, canWithdraw, canAmend, canManageBillingHold, canManageQualityHold] =
    await Promise.all([
      hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/print", "canPrint"),
      hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/download", "canPrint"),
      hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/portal-publish", "canApprove"),
      hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/withdraw", "canApprove"),
      hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/amend", "canApprove"),
      hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/billing-hold", "canApprove"),
      hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/quality-hold", "canApprove"),
    ]);

  return (
    <div className="space-y-8">
      <ModulePageHeader screenKey="reportReleaseDetail" description={t("laboratoryReportRelease.detail.description")} />
      <ReleaseDetailPanel
        release={release}
        snapshot={snapshot}
        eligibility={eligibility}
        verificationUrl={verificationUrl}
        qrDataUrl={qrDataUrl}
        permissions={{
          canPrint,
          canDownload,
          canPublishPortal,
          canWithdraw,
          canAmend,
          canManageBillingHold,
          canManageQualityHold,
        }}
      />
    </div>
  );
}
