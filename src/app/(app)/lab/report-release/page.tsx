import { ReportReleasePanel } from "@/components/diagnostic/ReportReleasePanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireSession } from "@/lib/auth";

export default async function ReportReleasePage() {
  const session = await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="reportRelease"
        description="Generate, print, PDF, portal release, and reprint audit for diagnostic reports."
      />
      <ReportReleasePanel branchCode={session.branchCode} />
    </div>
  );
}
