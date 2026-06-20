import { ModuleRegistryPanel } from "@/components/host/ModuleRegistryPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";
import { listModuleRegistry } from "@/lib/diagnostic/queries";

export default async function ModulesPage() {
  await requireHostSession();

  try {
    const modules = await listModuleRegistry();
    return (
      <div className="space-y-8">
        <ModulePageHeader
          screenKey="globalModuleRegistry"
          description="Global module registry — enable platform modules and assign to tenants."
        />
        <ModuleRegistryPanel modules={modules} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-8">
        <ModulePageHeader screenKey="globalModuleRegistry" description="Module registry." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load modules."} />
      </div>
    );
  }
}
