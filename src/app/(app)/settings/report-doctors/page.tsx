import { ReportDoctorAssignmentPanel } from "@/components/diagnostic-setup/ReportDoctorAssignmentPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listReportDoctorAssignments } from "@/lib/diagnostic/queries";

export default async function ReportDoctorsPage() {
  const session = await requireTenantSession();

  try {
    const items = await listReportDoctorAssignments(session.tenantId, session.branchId);
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="reportDoctorAssignment" description="Per-service doctor routing using tenant doctors only." />
        <ReportDoctorAssignmentPanel items={items} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="reportDoctorAssignment" description="Report doctor assignment." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load assignments."} />
      </div>
    );
  }
}
