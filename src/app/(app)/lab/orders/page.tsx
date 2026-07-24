import Link from "next/link";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabOrderListPanel } from "@/components/laboratory/LabOrderListPanel";
import { Button } from "@/components/ui";
import { listLabOrdersAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function LabOrdersPage() {
  const session = await requireTenantPermission("/lab/orders");
  const { t } = await getServerI18n(session);
  const [orders, canCreate] = await Promise.all([
    listLabOrdersAction(),
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/manual", "canCreate"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="labOrderList"
        description={t("laboratory.list.description")}
        action={
          canCreate ? (
            <Link href="/lab/orders/new">
              <Button>{t("laboratory.actions.create")}</Button>
            </Link>
          ) : undefined
        }
      />
      <LabOrderListPanel rows={orders} canCreate={canCreate} />
    </div>
  );
}
