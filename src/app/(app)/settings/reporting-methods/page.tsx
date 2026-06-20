import { ReportingMethodsPanel } from "@/components/diagnostic-setup/MasterGridsPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listReportingMethods } from "@/lib/diagnostic/queries";

export default async function ReportingMethodsPage() {
  const session = await requireTenantSession();

  try {
    const items = await listReportingMethods(session.tenantId);
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="reportingMethods" description="Reporting method master for tenant and inherited host methods." />
        <ReportingMethodsPanel items={items} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="reportingMethods" description="Reporting methods." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load reporting methods."} />
      </div>
    );
  }
}
