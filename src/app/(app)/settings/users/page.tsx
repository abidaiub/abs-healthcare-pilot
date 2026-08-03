import { UserManagementPanel } from "@/components/rbac/UserManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";
import { listTenantUsers } from "@/lib/rbac/queries";
import { getServerI18n } from "@/lib/i18n/server";

export default async function TenantUsersPage() {
  const session = await requireTenantPermission("/settings/users");
  const { t } = await getServerI18n(session);
  const [users, canCreate, canEdit] = await Promise.all([
    listTenantUsers(session.tenantId),
    hasTenantPermission(session.tenantId, session.userId, "/settings/users", "canCreate"),
    hasTenantPermission(session.tenantId, session.userId, "/settings/users", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantUserList"
        description={t("users.list.description")}
      />
      <UserManagementPanel users={users} canCreate={canCreate} canEdit={canEdit} />
    </div>
  );
}
