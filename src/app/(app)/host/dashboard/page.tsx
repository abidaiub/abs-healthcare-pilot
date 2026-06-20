import { HostSaasDashboardPanel } from "@/components/host/HostSaasDashboardPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";

export default async function HostDashboardPage() {
  await requireHostSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="hostDashboard"
        description="Layer 1 SaaS foundation — tenants, subscriptions, modules, and platform health."
      />
      <HostSaasDashboardPanel />
    </div>
  );
}
