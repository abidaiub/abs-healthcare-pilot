import { DiagnosticBillingPanel } from "@/components/diagnostic/DiagnosticBillingPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireSession } from "@/lib/auth";

export default async function DiagnosticBillingPage() {
  const session = await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="diagnosticBilling"
        description={`Create investigation bill and order at ${session.branchName}.`}
      />
      <DiagnosticBillingPanel />
    </div>
  );
}
