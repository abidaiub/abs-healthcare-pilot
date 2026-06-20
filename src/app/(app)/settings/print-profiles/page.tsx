import { PrintProfilesPanel } from "@/components/diagnostic-setup/PrintProfilesPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";

export default function PrintProfilesPage() {
  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="printProfiles" description="A4, A5, legal, and thermal print margin profiles." />
      <PrintProfilesPanel />
    </div>
  );
}
