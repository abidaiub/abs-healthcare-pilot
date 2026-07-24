import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ResultEntryWorklistPanel } from "@/components/laboratory-result/ResultEntryWorklistPanel";
import { searchResultEntryWorklistAction } from "@/app/actions/tenant-lab-results";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function ResultEntryWorklistPage() {
  const session = await requireTenantPermission("/lab/result-entry");
  const { t } = await getServerI18n(session);
  const [rows, canCreate] = await Promise.all([
    searchResultEntryWorklistAction(),
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="manualResultEntry" description={t("laboratoryResult.worklist.description")} />
      <ResultEntryWorklistPanel rows={rows} canCreate={canCreate} />
    </div>
  );
}
