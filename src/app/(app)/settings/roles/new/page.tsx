import { RoleFormPanel } from "@/components/rbac/RoleFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function CreateTenantRolePage() {
  await requireTenantPermission("/settings/roles", "canCreate");

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantRoleCreate"
        description="Create a tenant-scoped role, then configure its permission matrix."
      />
      <RoleFormPanel mode="create" />
    </div>
  );
}
