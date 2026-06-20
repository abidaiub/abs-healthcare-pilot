import { BillingLayoutsPanel } from "@/components/diagnostic-setup/BillingLayoutsPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";

export default function BillingLayoutsPage() {
  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="billingLayouts" description="Cash memo, money receipt, and invoice print layouts." />
      <BillingLayoutsPanel />
    </div>
  );
}
