import { TenantManagementPanel } from "@/components/host/TenantManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";
import { getServerI18n } from "@/lib/i18n/server";
import { listTenantsForHost } from "@/lib/saas/queries";

export default async function TenantManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireHostSession();
  const { t } = await getServerI18n(session);
  const params = await searchParams;
  const tenants = await listTenantsForHost();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="tenantManagement"
        description={t("tenant.management.description")}
      />
      <TenantManagementPanel initialFilter={params.filter} tenants={tenants} />
    </div>
  );
}
