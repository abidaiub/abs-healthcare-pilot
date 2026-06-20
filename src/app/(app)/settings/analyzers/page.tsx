import { AnalyzersPanel } from "@/components/diagnostic-setup/AnalyzersPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listAnalyzers } from "@/lib/diagnostic/queries";

export default async function AnalyzersPage() {
  const session = await requireTenantSession();

  try {
    const items = await listAnalyzers(session.tenantId, session.branchId);
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="analyzers" description="Branch-scoped analyzer machines for the current session branch." />
        <AnalyzersPanel items={items} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="analyzers" description="Analyzers." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load analyzers."} />
      </div>
    );
  }
}
