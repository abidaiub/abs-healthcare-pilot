import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabCollectionPanel } from "@/components/laboratory/LabCollectionPanel";
import { listCollectionWorklistAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function LabCollectionPage() {
  const session = await requireTenantPermission("/lab/collection");
  const { t } = await getServerI18n(session);
  const [orders, canCollect] = await Promise.all([
    listCollectionWorklistAction(),
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/collect", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labCollectionWorklist" description={t("laboratory.collection.description")} />
      <LabCollectionPanel orders={orders} canCollect={canCollect} />
    </div>
  );
}
