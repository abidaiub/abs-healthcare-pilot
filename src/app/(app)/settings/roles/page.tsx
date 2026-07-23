import { RoleManagementPanel } from "@/components/rbac/RoleManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { listTenantRoles } from "@/lib/rbac/queries";

export default async function TenantRolesPage() {
  const session = await requireTenantPermission("/settings/roles");
  const { t } = await getServerI18n(session);
  const roles = await listTenantRoles(session.tenantId);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantRoleList"
        description={t("rbac.roles.description")}
      />
      <RoleManagementPanel roles={roles} />
    </div>
  );
}
