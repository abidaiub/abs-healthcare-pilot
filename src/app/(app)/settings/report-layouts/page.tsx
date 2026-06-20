import { ReportLayoutsPanel } from "@/components/diagnostic-setup/ReportLayoutsPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";

export default function ReportLayoutsPage() {
  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="reportLayouts" description="Lab, radiology, and cardiology report layouts with live preview." />
      <ReportLayoutsPanel />
    </div>
  );
}
