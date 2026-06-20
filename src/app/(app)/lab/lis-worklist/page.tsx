import { LisWorklistPanel } from "@/components/diagnostic/LisWorklistPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireSession } from "@/lib/auth";

export default async function LisWorklistPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="lisWorklist"
        description="Analyzer interface queue — HL7, ASTM, middleware, manual, CSV, and API import readiness."
      />
      <LisWorklistPanel />
    </div>
  );
}
