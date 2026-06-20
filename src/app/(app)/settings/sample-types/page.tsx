import { SampleTypesPanel } from "@/components/diagnostic-setup/MasterGridsPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listSampleTypes } from "@/lib/diagnostic/queries";

export default async function SampleTypesPage() {
  const session = await requireTenantSession();

  try {
    const items = await listSampleTypes(session.tenantId);
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="sampleTypes" description="Sample material master for tenant and inherited host types." />
        <SampleTypesPanel items={items} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="sampleTypes" description="Sample types." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load sample types."} />
      </div>
    );
  }
}
