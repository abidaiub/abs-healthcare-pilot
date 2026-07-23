import { UserManagementPanel } from "@/components/rbac/UserManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { listTenantUsers } from "@/lib/rbac/queries";

export default async function TenantUsersPage() {
  const session = await requireTenantPermission("/settings/users");
  const users = await listTenantUsers(session.tenantId);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantUserList"
        description="Manage tenant staff accounts, primary roles, branches, and account status."
      />
      <UserManagementPanel users={users} />
    </div>
  );
}
