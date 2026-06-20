import { ImportedServicesPanel } from "@/components/diagnostic-setup/ImportedServicesPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listTenantBranches, listTenantImportedServices } from "@/lib/diagnostic/queries";

export default async function ImportedServicesPage() {
  const session = await requireTenantSession();

  try {
    const [services, branches] = await Promise.all([
      listTenantImportedServices(session.tenantId),
      listTenantBranches(session.tenantId),
    ]);

    return (
      <div className="space-y-6">
        <ModulePageHeader
          screenKey="importedServices"
          description="Tenant copy of imported diagnostic services — configure price, method, and reporting."
        />
        <ImportedServicesPanel services={services} branches={branches} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="importedServices" description="Imported diagnostic services." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load services."} />
      </div>
    );
  }
}
