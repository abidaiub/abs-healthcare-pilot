import { PortalReportsPanel } from "@/components/diagnostic/PortalReportsPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";

export default function PortalReportsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <ModulePageHeader
        screenKey="portalReports"
        description="Patient self-service report list with OTP login readiness."
      />
      <PortalReportsPanel />
    </div>
  );
}
