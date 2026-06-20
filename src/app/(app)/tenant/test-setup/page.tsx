import { TenantTestSetupPanel } from "@/components/diagnostic/TenantTestSetupPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireSession } from "@/lib/auth";

export default async function TenantTestSetupPage() {
  const session = await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="tenantTestSetup"
        description={`Import host tests and configure local price, TAT, and branch availability for ${session.tenantName}.`}
      />
      <TenantTestSetupPanel branchCode={session.branchCode} />
    </div>
  );
}
