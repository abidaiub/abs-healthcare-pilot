import { SubscriptionPackagePanel } from "@/components/host/SubscriptionPackagePanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";

export default async function SubscriptionPackagesPage() {
  await requireHostSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="subscriptionPackages"
        description="Subscription package master — fees, feature flags, and included limits."
      />
      <SubscriptionPackagePanel />
    </div>
  );
}
