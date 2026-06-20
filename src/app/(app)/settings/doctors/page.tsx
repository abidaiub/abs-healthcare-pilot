import { DoctorsPanel } from "@/components/diagnostic-setup/DoctorsPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listDoctors, listTenantBranches } from "@/lib/diagnostic/queries";

export default async function DoctorsPage() {
  const session = await requireTenantSession();

  try {
    const [doctors, branches] = await Promise.all([
      listDoctors(session.tenantId),
      listTenantBranches(session.tenantId),
    ]);

    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="diagnosticDoctors" description="Tenant doctor registry with branch and department mappings." />
        <DoctorsPanel doctors={doctors} branches={branches} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="diagnosticDoctors" description="Doctors." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load doctors."} />
      </div>
    );
  }
}
