import { TenantFormPanel } from "@/components/host/TenantFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";

export default async function TenantCreatePage() {
  await requireHostSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="tenantCreate"
        description="Create a new tenant with profile, branding, deployment, admin, and package."
      />
      <TenantFormPanel mode="create" />
    </div>
  );
}
