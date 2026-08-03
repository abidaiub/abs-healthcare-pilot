import { notFound } from "next/navigation";
import { UserFormPanel } from "@/components/rbac/UserFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { listTenantBranches, listTenantDepartments } from "@/lib/diagnostic/queries";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { getTenantUserDetail, listTenantRoles } from "@/lib/rbac/queries";

export default async function EditTenantUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await requireTenantPermission("/settings/users", "canEdit");
  const excludeAdminRoles =
    session.user.roleCode === "TENANT_ADMIN" ||
    session.user.roleCode === "DP_TENANT_ADMIN";
  const [user, assignableRoles, allRoles, branches, departments] = await Promise.all([
    getTenantUserDetail(session.tenantId, userId),
    listTenantRoles(session.tenantId, {
      excludeAdminRoles,
      activeOnly: true,
    }),
    listTenantRoles(session.tenantId, { activeOnly: true }),
    listTenantBranches(session.tenantId),
    listTenantDepartments(session.tenantId),
  ]);

  if (!user) notFound();

  const roles = [...assignableRoles];
  if (
    user.primaryRoleId &&
    !roles.some((role) => role.id === user.primaryRoleId)
  ) {
    const current = allRoles.find((role) => role.id === user.primaryRoleId);
    if (current) roles.unshift(current);
  }

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantUserEdit"
        description={`Edit ${user.username}, reset password, and update role or branch assignment.`}
      />
      <UserFormPanel mode="edit" user={user} roles={roles} branches={branches} departments={departments} />
    </div>
  );
}
