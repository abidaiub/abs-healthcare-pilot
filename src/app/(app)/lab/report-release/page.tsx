import Link from "next/link";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ReleaseWorklistPanel } from "@/components/laboratory-report-release/ReleaseWorklistPanel";
import { listReleaseQueueAction } from "@/app/actions/tenant-lab-report-release";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";
import { Button } from "@/components/ui";

export default async function ReportReleasePage() {
  const session = await requireTenantPermission("/lab/report-release");
  const { t } = await getServerI18n(session);
  const queue = await listReleaseQueueAction();
  const [canAuthorize, canPrepare] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/release", "canApprove"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/report-release/prepare", "canEdit"),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ModulePageHeader
          screenKey="reportRelease"
          description={t("laboratoryReportRelease.worklist.description")}
        />
        <Link href="/lab/report-release/history">
          <Button type="button" variant="secondary">{t("laboratoryReportRelease.actions.viewHistory")}</Button>
        </Link>
      </div>
      <ReleaseWorklistPanel
        pendingReleases={queue.pendingReleases}
        verifiedWithoutRelease={queue.verifiedWithoutRelease}
        canAuthorize={canAuthorize}
        canPrepare={canPrepare}
      />
    </div>
  );
}
