import { DoctorsPanel } from "@/components/diagnostic-setup/DoctorsPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listDoctors, listTenantBranches, listTenantDepartments } from "@/lib/diagnostic/queries";

export default async function DoctorsPage() {
  const session = await requireTenantSession();
  let data: Awaited<ReturnType<typeof loadDoctorsPageData>>;

  try {
    data = await loadDoctorsPageData(session.tenantId);
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="diagnosticDoctors" description="Doctors." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load doctors."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="diagnosticDoctors" description="Tenant doctor registry with branch and department mappings." />
      <DoctorsPanel doctors={data.doctors} branches={data.branches} departments={data.departments} />
    </div>
  );
}

async function loadDoctorsPageData(tenantId: string) {
  const [doctors, branches, departments] = await Promise.all([
    listDoctors(tenantId),
    listTenantBranches(tenantId),
    listTenantDepartments(tenantId),
  ]);

  return { doctors, branches, departments };
}
