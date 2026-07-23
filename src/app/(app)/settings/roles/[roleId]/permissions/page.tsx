import { notFound } from "next/navigation";
import { PermissionMatrixPanel } from "@/components/rbac/RoleFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantPermission } from "@/lib/rbac/auth";
import {
  assertTenantOwnsRole,
  getRolePermissionMatrix,
  listTenantRoles,
} from "@/lib/rbac/queries";

export default async function TenantRolePermissionsPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  const session = await requireTenantPermission("/settings/roles", "canEdit");

  const [role, matrix, roles] = await Promise.all([
    assertTenantOwnsRole(session.tenantId, roleId).catch(() => null),
    getRolePermissionMatrix(session.tenantId, roleId),
    listTenantRoles(session.tenantId),
  ]);

  if (!role) notFound();

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantPermissionMatrix"
        description={`Permission matrix for ${role.roleCode}. Changes are audited.`}
      />
      <PermissionMatrixPanel
        roleId={roleId}
        roleName={role.roleName}
        matrix={matrix}
        roles={roles}
      />
    </div>
  );
}
