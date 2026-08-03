import { prisma } from "@/lib/db";
import {
  TENANT_ADMIN_ACCESS_GRANTS,
  TENANT_ADMIN_ROLE_CODES,
  permissionStateToken,
  type TenantAdminAccessGrantId,
} from "@/lib/saas/tenant-admin-access";

export type TenantAdminAccessRecord = {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  tenantStatus: string;
  administrator: {
    id: string;
    displayName: string;
    username: string;
    email: string;
    phone: string | null;
    status: string;
    roleId: string;
    roleName: string;
    roleCode: string;
    lastLoginAt: string | null;
  };
  selectedGrantIds: TenantAdminAccessGrantId[];
  stateToken: string;
};

export async function getTenantAdminAccess(
  tenantId: string,
): Promise<TenantAdminAccessRecord | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      tenantName: true,
      tenantCode: true,
      tenantStatus: true,
      users: {
        where: {
          isHostAdmin: false,
          isActive: true,
          userRoles: {
            some: {
              isActive: true,
              role: { roleCode: { in: [...TENANT_ADMIN_ROLE_CODES] }, isActive: true },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          userStatus: true,
          userRoles: {
            where: {
              isActive: true,
              role: { roleCode: { in: [...TENANT_ADMIN_ROLE_CODES] }, isActive: true },
            },
            take: 1,
            select: {
              roleId: true,
              role: { select: { roleName: true, roleCode: true, permissions: true } },
            },
          },
        },
      },
    },
  });

  const user = tenant?.users[0];
  const assignment = user?.userRoles[0];
  if (!tenant || !user || !assignment) return null;

  const permissionMap = new Map(
    assignment.role.permissions
      .filter((permission) => permission.isActive)
      .map((permission) => [permission.resourceKey, permission]),
  );
  const selectedGrantIds = TENANT_ADMIN_ACCESS_GRANTS.filter((grant) => {
    const permission = permissionMap.get(grant.resourceKey);
    return Boolean(permission?.[grant.action]);
  }).map((grant) => grant.id);

  return {
    tenantId: tenant.id,
    tenantName: tenant.tenantName,
    tenantCode: tenant.tenantCode,
    tenantStatus: tenant.tenantStatus,
    administrator: {
      id: user.id,
      displayName: user.username,
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.userStatus,
      roleId: assignment.roleId,
      roleName: assignment.role.roleName,
      roleCode: assignment.role.roleCode,
      lastLoginAt: null,
    },
    selectedGrantIds,
    stateToken: permissionStateToken(assignment.role.permissions),
  };
}
