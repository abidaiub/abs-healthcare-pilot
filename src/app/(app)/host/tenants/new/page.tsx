import { TenantFormPanel } from "@/components/host/TenantFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";
import { listSubscriptionPackages } from "@/lib/saas/queries";

export default async function TenantCreatePage() {
  await requireHostSession();
  const packages = await listSubscriptionPackages();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="tenantCreate"
        description="Create a new tenant with profile, branding, admin, and subscription package."
      />
      <TenantFormPanel mode="create" packages={packages} />
    </div>
  );
}
