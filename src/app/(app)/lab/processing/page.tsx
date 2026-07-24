import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabProcessingPanel } from "@/components/laboratory/LabProcessingPanel";
import { listProcessingWorklistAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function LabProcessingPage() {
  const session = await requireTenantPermission("/lab/processing");
  const { t } = await getServerI18n(session);
  const [samples, canEdit] = await Promise.all([
    listProcessingWorklistAction(),
    hasTenantPermission(session.tenantId, session.userId, "/lab/processing", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labProcessingWorklist" description={t("laboratory.processing.description")} />
      <LabProcessingPanel samples={samples} canEdit={canEdit} />
    </div>
  );
}
