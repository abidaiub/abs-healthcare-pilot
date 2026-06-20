import { ServiceCatalogImportPanel } from "@/components/diagnostic-setup/ServiceCatalogImportPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listImportableHostServices } from "@/lib/diagnostic/queries";

export default async function ServiceCatalogPage() {
  const session = await requireTenantSession();

  try {
    const items = await listImportableHostServices(session.tenantId);
    return (
      <div className="space-y-6">
        <ModulePageHeader
          screenKey="serviceCatalogImport"
          description="Browse host catalog and import services to tenant setup."
        />
        <ServiceCatalogImportPanel items={items} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="serviceCatalogImport" description="Browse host catalog and import services." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load catalog."} />
      </div>
    );
  }
}
