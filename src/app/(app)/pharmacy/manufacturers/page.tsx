import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ManufacturerManagementPanel } from "@/components/pharmacy/ManufacturerManagementPanel";
import { listManufacturersAction } from "@/app/actions/tenant-medications";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function ManufacturersPage() {
  const session = await requireTenantPermission("/pharmacy/manufacturers");
  const { t } = await getServerI18n(session);
  const [manufacturers, canCreate] = await Promise.all([
    listManufacturersAction(),
    hasTenantPermission(session.tenantId, session.userId, "/pharmacy/manufacturers", "canCreate"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="manufacturerManagement" description={t("pharmacy.manufacturers.description")} />
      <ManufacturerManagementPanel manufacturers={manufacturers} canCreate={canCreate} />
    </div>
  );
}
