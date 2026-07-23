import { RoleManagementPanel } from "@/components/rbac/RoleManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { listTenantRoles } from "@/lib/rbac/queries";

export default async function TenantRolesPage() {
  const session = await requireTenantPermission("/settings/roles");
  const roles = await listTenantRoles(session.tenantId);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantRoleList"
        description="Define tenant roles and maintain the permission matrix for each role."
      />
      <RoleManagementPanel roles={roles} />
    </div>
  );
}
