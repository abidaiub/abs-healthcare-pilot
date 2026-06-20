import { TestMethodsPanel } from "@/components/diagnostic-setup/MasterGridsPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listTestMethods } from "@/lib/diagnostic/queries";

export default async function TestMethodsPage() {
  const session = await requireTenantSession();

  try {
    const items = await listTestMethods(session.tenantId, session.branchId);
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="testMethods" description="Tenant test methods scoped by branch where applicable." />
        <TestMethodsPanel items={items} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="testMethods" description="Test methods." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load test methods."} />
      </div>
    );
  }
}
