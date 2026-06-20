import { HostTestCatalogPanel } from "@/components/diagnostic/HostTestCatalogPanel";
import { SetupEmptyState, SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";
import {
  getHostCatalogKpis,
  listHostCatalogServices,
  listTenantOptions,
} from "@/lib/diagnostic/queries";

export default async function HostCatalogPage() {
  await requireHostSession();

  try {
    const services = await listHostCatalogServices();
    const [kpis, tenants] = await Promise.all([
      getHostCatalogKpis(services),
      listTenantOptions(),
    ]);

    if (services.length === 0) {
      return (
        <div className="space-y-8">
          <ModulePageHeader
            screenKey="hostTestCatalog"
            description="Global diagnostic library — source catalog for all tenants."
          />
          <SetupEmptyState
            title="Host catalog empty"
            description="Run prisma db seed to populate host diagnostic catalog."
          />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <ModulePageHeader
          screenKey="hostTestCatalog"
          description="Global AI-assisted diagnostic library — source catalog for all tenants. Host admin maintains; tenants import and configure."
        />
        <HostTestCatalogPanel services={services} kpis={kpis} tenants={tenants} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-8">
        <ModulePageHeader screenKey="hostTestCatalog" description="Host master catalog." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load host catalog."} />
      </div>
    );
  }
}
