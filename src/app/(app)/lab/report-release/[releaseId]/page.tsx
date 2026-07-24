import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ReleaseDetailPanel } from "@/components/laboratory-report-release/ReleaseDetailPanel";
import { getReleaseDetailAction } from "@/app/actions/tenant-lab-report-release";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";
import { parseReportSnapshot } from "@/lib/laboratory-report-release/snapshot";

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
  const [canPrint, canDownload, canPublishPortal, canWithdraw, canAmend] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/print", "canPrint"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/download", "canPrint"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/portal-publish", "canApprove"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/withdraw", "canApprove"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/amend", "canApprove"),
  ]);

  return (
    <div className="space-y-8">
      <ModulePageHeader screenKey="reportReleaseDetail" description={t("laboratoryReportRelease.detail.description")} />
      <ReleaseDetailPanel
        release={release}
        snapshot={snapshot}
        permissions={{ canPrint, canDownload, canPublishPortal, canWithdraw, canAmend }}
      />
    </div>
  );
}
