import { DepartmentsPanel } from "@/components/operational-readiness/DepartmentsPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { listTenantOwnedDepartments } from "@/lib/operational-readiness/queries";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function DepartmentsReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const departments = await listTenantOwnedDepartments(session.tenantId);
  const [canCreate, canEdit] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, READINESS_RESOURCE, "canCreate"),
    hasTenantPermission(session.tenantId, session.userId, READINESS_RESOURCE, "canEdit"),
  ]);

  return (
    <ReadinessPageShell
      screenKey="readinessDepartments"
      description="Browser CRUD for operating departments with enable/disable and audit."
    >
      <DepartmentsPanel
        departments={departments}
        canCreate={canCreate}
        canEdit={canEdit}
      />
    </ReadinessPageShell>
  );
}
