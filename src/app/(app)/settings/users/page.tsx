import { UserManagementPanel } from "@/components/rbac/UserManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { listTenantUsers } from "@/lib/rbac/queries";
import { getServerI18n } from "@/lib/i18n/server";

export default async function TenantUsersPage() {
  const session = await requireTenantPermission("/settings/users");
  const { t } = await getServerI18n(session);
  const users = await listTenantUsers(session.tenantId);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantUserList"
        description={t("users.list.description")}
      />
      <UserManagementPanel users={users} />
    </div>
  );
}
