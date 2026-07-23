"use server";

import { revalidatePath } from "next/cache";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  TENANT_PERMISSION_RESOURCES,
  type PermissionAction,
} from "@/lib/rbac/permission-catalog";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { assertTenantOwnsRole } from "@/lib/rbac/queries";
import { writeAuditLog } from "@/lib/saas/audit";

export type TenantRoleActionResult =
  | { ok: true; roleId?: string }
  | { ok: false; error: string };

async function getRoleActor(requireEdit = true) {
  if (requireEdit) {
    return requireTenantPermission("/settings/roles", "canEdit");
  }
  return requireTenantSession();
}

function revalidateRolePaths(tenantId: string, roleId?: string) {
  revalidatePath("/settings/roles");
  if (roleId) {
    revalidatePath(`/settings/roles/${roleId}/permissions`);
  }
  revalidatePath("/host/audit");
}

export async function createTenantRoleAction(
  formData: FormData,
): Promise<TenantRoleActionResult> {
  const session = await requireTenantPermission("/settings/roles", "canCreate");
  const roleCode = String(formData.get("roleCode") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const roleName = String(formData.get("roleName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!roleCode || !roleName) {
    return { ok: false, error: "Role code and role name are required." };
  }

  const existing = await prisma.role.findFirst({
    where: { tenantId: session.tenantId, roleCode },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Role code already exists for this tenant." };
  }

  const role = await prisma.role.create({
    data: {
      tenantId: session.tenantId,
      roleCode,
      roleName,
      description,
      createdBy: session.user.name,
      updatedBy: session.user.name,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    actionType: "INSERT",
    entityType: "Role",
    entityId: role.id,
    changeData: { newValue: `${roleCode} — ${roleName}` },
    createdBy: session.user.name,
  });

  revalidateRolePaths(session.tenantId, role.id);
  return { ok: true, roleId: role.id };
}

export async function updateTenantRoleAction(
  roleId: string,
  formData: FormData,
): Promise<TenantRoleActionResult> {
  const session = await requireTenantPermission("/settings/roles", "canEdit");
  const role = await assertTenantOwnsRole(session.tenantId, roleId);

  if (role.roleCode === "TENANT_ADMIN") {
    return { ok: false, error: "Primary tenant admin role cannot be edited." };
  }

  const roleName = String(formData.get("roleName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!roleName) {
    return { ok: false, error: "Role name is required." };
  }

  await prisma.role.update({
    where: { id: roleId },
    data: {
      roleName,
      description,
      isActive,
      updatedBy: session.user.name,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    actionType: "UPDATE",
    entityType: "Role",
    entityId: roleId,
    changeData: { newValue: roleName, isActive },
    createdBy: session.user.name,
  });

  revalidateRolePaths(session.tenantId, roleId);
  return { ok: true, roleId };
}

export async function saveRolePermissionMatrixAction(
  roleId: string,
  formData: FormData,
): Promise<TenantRoleActionResult> {
  const session = await requireTenantPermission("/settings/roles", "canEdit");
  await assertTenantOwnsRole(session.tenantId, roleId);

  const updates = TENANT_PERMISSION_RESOURCES.map((resource) => {
    const prefix = resource.resourceKey.replace(/\//g, "_");
    const readFlag = (action: PermissionAction) =>
      formData.get(`${prefix}:${action}`) === "on";

    return {
      tenantId: session.tenantId,
      roleId,
      permissionCode: resource.permissionCode,
      moduleCode: resource.moduleCode,
      resourceKey: resource.resourceKey,
      canView: readFlag("canView"),
      canCreate: readFlag("canCreate"),
      canEdit: readFlag("canEdit"),
      canDelete: readFlag("canDelete"),
      canApprove: readFlag("canApprove"),
      canPrint: readFlag("canPrint"),
      createdBy: session.user.name,
      updatedBy: session.user.name,
    };
  });

  await prisma.$transaction(async (tx) => {
    for (const permission of updates) {
      await tx.permission.upsert({
        where: {
          roleId_resourceKey: {
            roleId,
            resourceKey: permission.resourceKey,
          },
        },
        update: {
          ...permission,
          isActive: true,
        },
        create: permission,
      });
    }
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    actionType: "UPDATE",
    entityType: "PermissionMatrix",
    entityId: roleId,
    changeData: {
      newValue: "Permission matrix saved",
      resourceCount: updates.length,
    },
    createdBy: session.user.name,
  });

  revalidateRolePaths(session.tenantId, roleId);
  return { ok: true, roleId };
}

export async function copyRolePermissionsAction(input: {
  roleId: string;
  sourceRoleId: string;
}): Promise<TenantRoleActionResult> {
  const session = await requireTenantPermission("/settings/roles", "canEdit");
  await assertTenantOwnsRole(session.tenantId, input.roleId);
  await assertTenantOwnsRole(session.tenantId, input.sourceRoleId);

  const sourcePermissions = await prisma.permission.findMany({
    where: {
      tenantId: session.tenantId,
      roleId: input.sourceRoleId,
      isActive: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const permission of sourcePermissions) {
      await tx.permission.upsert({
        where: {
          roleId_resourceKey: {
            roleId: input.roleId,
            resourceKey: permission.resourceKey,
          },
        },
        update: {
          canView: permission.canView,
          canCreate: permission.canCreate,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
          canApprove: permission.canApprove,
          canPrint: permission.canPrint,
          isActive: true,
          updatedBy: session.user.name,
        },
        create: {
          tenantId: session.tenantId,
          roleId: input.roleId,
          permissionCode: permission.permissionCode,
          moduleCode: permission.moduleCode,
          resourceKey: permission.resourceKey,
          canView: permission.canView,
          canCreate: permission.canCreate,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
          canApprove: permission.canApprove,
          canPrint: permission.canPrint,
          createdBy: session.user.name,
          updatedBy: session.user.name,
        },
      });
    }
  });

  revalidateRolePaths(session.tenantId, input.roleId);
  return { ok: true, roleId: input.roleId };
}
