import { prisma } from "@/lib/db";
import {
  getResourceByRoute,
  TENANT_PERMISSION_RESOURCES,
  type PermissionAction,
} from "@/lib/rbac/permission-catalog";
import {
  canAccess,
  canAccessRoute,
  mergePermissionRows,
} from "@/lib/rbac/permissions";
import type {
  EffectivePermission,
  PermissionMatrixRow,
  TenantRoleRow,
  TenantUserDetail,
  TenantUserRow,
} from "@/lib/rbac/types";

function mapUserRow(user: {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  userStatus: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  updatedAt: Date;
  userRoles: Array<{
    isPrimary: boolean;
    role: { roleName: string; roleCode: string };
  }>;
  userBranches: Array<{
    isPrimary: boolean;
    branch: { name: string };
  }>;
}): TenantUserRow {
  const primaryRole =
    user.userRoles.find((entry) => entry.isPrimary) ?? user.userRoles[0];
  const primaryBranch =
    user.userBranches.find((entry) => entry.isPrimary) ?? user.userBranches[0];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    userStatus: user.userStatus,
    isActive: user.isActive,
    forcePasswordChange: user.forcePasswordChange,
    primaryRoleName: primaryRole?.role.roleName ?? null,
    primaryRoleCode: primaryRole?.role.roleCode ?? null,
    primaryBranchName: primaryBranch?.branch.name ?? null,
    roleCount: user.userRoles.length,
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listTenantUsers(tenantId: string): Promise<TenantUserRow[]> {
  const users = await prisma.user.findMany({
    where: {
      tenantId,
      isHostAdmin: false,
    },
    include: {
      userRoles: {
        where: { isActive: true },
        include: { role: true },
      },
      userBranches: {
        where: { isActive: true },
        include: { branch: true },
      },
    },
    orderBy: [{ isActive: "desc" }, { username: "asc" }],
  });

  return users.map(mapUserRow);
}

export async function getTenantUserDetail(
  tenantId: string,
  userId: string,
): Promise<TenantUserDetail | null> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
      isHostAdmin: false,
    },
    include: {
      userRoles: {
        where: { isActive: true },
        include: { role: true },
      },
      userBranches: {
        where: { isActive: true },
        include: { branch: true },
      },
    },
  });

  if (!user) return null;

  const primaryRole =
    user.userRoles.find((entry) => entry.isPrimary) ?? user.userRoles[0];
  const primaryBranch =
    user.userBranches.find((entry) => entry.isPrimary) ?? user.userBranches[0];

  return {
    ...mapUserRow(user),
    roleIds: user.userRoles.map((entry) => entry.roleId),
    primaryRoleId: primaryRole?.roleId ?? null,
    branchIds: user.userBranches.map((entry) => entry.branchId),
    primaryBranchId: primaryBranch?.branchId ?? null,
  };
}

export async function listTenantRoles(tenantId: string): Promise<TenantRoleRow[]> {
  const roles = await prisma.role.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          userRoles: { where: { isActive: true } },
          permissions: { where: { isActive: true } },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { roleName: "asc" }],
  });

  return roles.map((role) => ({
    id: role.id,
    roleCode: role.roleCode,
    roleName: role.roleName,
    description: role.description,
    isActive: role.isActive,
    userCount: role._count.userRoles,
    permissionCount: role._count.permissions,
  }));
}

export async function getRolePermissionMatrix(
  tenantId: string,
  roleId: string,
): Promise<PermissionMatrixRow[]> {
  const role = await prisma.role.findFirst({
    where: { id: roleId, tenantId },
    include: {
      permissions: {
        where: { isActive: true },
      },
    },
  });

  if (!role) return [];

  const permissionMap = new Map(
    role.permissions.map((permission) => [permission.resourceKey, permission]),
  );

  return TENANT_PERMISSION_RESOURCES.map((resource) => {
    const permission = permissionMap.get(resource.resourceKey);
    return {
      resourceKey: resource.resourceKey,
      moduleCode: resource.moduleCode,
      permissionCode: resource.permissionCode,
      label: resource.label,
      group: resource.group,
      canView: permission?.canView ?? false,
      canCreate: permission?.canCreate ?? false,
      canEdit: permission?.canEdit ?? false,
      canDelete: permission?.canDelete ?? false,
      canApprove: permission?.canApprove ?? false,
      canPrint: permission?.canPrint ?? false,
    };
  });
}

export async function getEffectivePermissionsForUser(
  tenantId: string,
  userId: string,
): Promise<Map<string, EffectivePermission>> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      tenantId,
      userId,
      isActive: true,
      user: { isActive: true, userStatus: "ACTIVE" },
      role: { isActive: true },
    },
    include: {
      role: {
        include: {
          permissions: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  const permissionRows = userRoles.flatMap((entry) => entry.role.permissions);
  return mergePermissionRows(permissionRows);
}

export async function userCanAccessRoute(
  tenantId: string,
  userId: string,
  route: string,
  action: PermissionAction = "canView",
): Promise<boolean> {
  const permissions = await getEffectivePermissionsForUser(tenantId, userId);
  return canAccessRoute(permissions, route, action);
}

export async function userCanAccessResource(
  tenantId: string,
  userId: string,
  resourceKey: string,
  action: PermissionAction = "canView",
): Promise<boolean> {
  const permissions = await getEffectivePermissionsForUser(tenantId, userId);
  return canAccess(permissions, resourceKey, action);
}

export function resolveResourceKeyFromRoute(route: string): string | null {
  return getResourceByRoute(route)?.resourceKey ?? null;
}

export async function assertTenantOwnsUser(tenantId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isHostAdmin: false },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found for this tenant.");
  }
}

export async function assertTenantOwnsRole(tenantId: string, roleId: string) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, tenantId },
    select: { id: true, roleCode: true, roleName: true },
  });

  if (!role) {
    throw new Error("Role not found for this tenant.");
  }

  return role;
}

export async function getTenantPrimaryBranchId(
  tenantId: string,
  userId: string,
): Promise<string | null> {
  const assignment = await prisma.userBranch.findFirst({
    where: {
      tenantId,
      userId,
      isActive: true,
      isPrimary: true,
    },
    select: { branchId: true },
  });

  return assignment?.branchId ?? null;
}
