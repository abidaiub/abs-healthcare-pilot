import { LabelPrintPanel } from "@/components/diagnostic/LabelPrintPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireSession } from "@/lib/auth";

export default async function LabelPrintPage() {
  const session = await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="labelPrint"
        description="Print barcode tube labels for collected and pending samples."
      />
      <LabelPrintPanel branchCode={session.branchCode} />
    </div>
  );
}
