import { TestParametersPanel } from "@/components/diagnostic-setup/TestParametersPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listTenantServiceOptions, listTestParameters } from "@/lib/diagnostic/queries";

export default async function TestParametersPage() {
  const session = await requireTenantSession();

  try {
    const [parameters, services] = await Promise.all([
      listTestParameters(session.tenantId),
      listTenantServiceOptions(session.tenantId),
    ]);

    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="testParameters" description="Parameter units, reference ranges, and critical limits." />
        <TestParametersPanel parameters={parameters} services={services} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="testParameters" description="Test parameters." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load parameters."} />
      </div>
    );
  }
}
