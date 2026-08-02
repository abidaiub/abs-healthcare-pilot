import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LisWorklistPanel } from "@/components/laboratory-lis/LisWorklistPanel";
import { listImportQueueAction } from "@/app/actions/tenant-lab-lis";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function LisWorklistPage() {
  const session = await requireTenantPermission("/lab/lis-worklist");
  const { t } = await getServerI18n(session);
  const [rows, canImport, canReconcile] = await Promise.all([
    listImportQueueAction(),
    hasTenantPermission(session.tenantId, session.userId, "/lab/lis-worklist/import", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/lis-worklist/reconcile", "canApprove"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="lisWorklist" description={t("laboratoryLis.description")} />
      <LisWorklistPanel rows={rows} canImport={canImport} canReconcile={canReconcile} />
    </div>
  );
}
