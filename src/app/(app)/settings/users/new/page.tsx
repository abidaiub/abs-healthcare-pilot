import { UserFormPanel } from "@/components/rbac/UserFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { listTenantBranches, listTenantDepartments } from "@/lib/diagnostic/queries";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { listTenantRoles } from "@/lib/rbac/queries";

export default async function CreateTenantUserPage() {
  const session = await requireTenantPermission("/settings/users", "canCreate");
  const excludeAdminRoles =
    session.user.roleCode === "TENANT_ADMIN" ||
    session.user.roleCode === "DP_TENANT_ADMIN";
  const [roles, branches, departments] = await Promise.all([
    listTenantRoles(session.tenantId, {
      excludeAdminRoles,
      activeOnly: true,
    }),
    listTenantBranches(session.tenantId),
    listTenantDepartments(session.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantUserCreate"
        description="Create a tenant user with primary role and branch assignment."
      />
      <UserFormPanel mode="create" roles={roles} branches={branches} departments={departments} />
    </div>
  );
}
