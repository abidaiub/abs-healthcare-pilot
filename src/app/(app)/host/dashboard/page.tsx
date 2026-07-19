import { HostSaasDashboardPanel } from "@/components/host/HostSaasDashboardPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";
import { getHostDashboardKpis, listTenantsForHost } from "@/lib/saas/queries";

export default async function HostDashboardPage() {
  await requireHostSession();
  const [kpis, tenants] = await Promise.all([
    getHostDashboardKpis(),
    listTenantsForHost(),
  ]);

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="hostDashboard"
        description="Layer 1 SaaS foundation — tenants, subscriptions, modules, and platform health."
      />
      <HostSaasDashboardPanel kpis={kpis} tenants={tenants} />
    </div>
  );
}
