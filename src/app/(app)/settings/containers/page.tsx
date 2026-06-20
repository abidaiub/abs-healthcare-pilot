import { ContainersPanel } from "@/components/diagnostic-setup/MasterGridsPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listContainers } from "@/lib/diagnostic/queries";

export default async function ContainersPage() {
  const session = await requireTenantSession();

  try {
    const items = await listContainers(session.tenantId);
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="containers" description="Tube and container master for tenant and inherited host catalog." />
        <ContainersPanel items={items} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="containers" description="Containers." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load containers."} />
      </div>
    );
  }
}
