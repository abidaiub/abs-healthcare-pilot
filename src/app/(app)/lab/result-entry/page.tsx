import { ManualResultEntryPanel } from "@/components/diagnostic/ManualResultEntryPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireSession } from "@/lib/auth";

export default async function ManualResultEntryPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="manualResultEntry"
        description="Technologist manual result entry when analyzer is not connected or for manual tests."
      />
      <ManualResultEntryPanel />
    </div>
  );
}
