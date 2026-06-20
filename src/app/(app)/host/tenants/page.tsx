import { TenantManagementPanel } from "@/components/host/TenantManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";

export default async function TenantManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireHostSession();
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="tenantManagement"
        description="Provision tenants, branches, subscriptions, modules, and usage limits."
      />
      <TenantManagementPanel initialFilter={params.filter} />
    </div>
  );
}
