import { ResultDisplayPanel } from "@/components/diagnostic-setup/ResultDisplayPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";

export default function ResultDisplayPage() {
  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="resultDisplayRules" description="Normal, high, low, and critical result display styling." />
      <ResultDisplayPanel />
    </div>
  );
}
