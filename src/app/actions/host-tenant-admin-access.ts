"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requireHostSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TENANT_PERMISSION_RESOURCES } from "@/lib/rbac/permission-catalog";
import {
  TENANT_ADMIN_ACCESS_GRANTS,
  TENANT_ADMIN_ROLE_CODES,
  permissionStateToken,
  type TenantAdminAccessGrantId,
} from "@/lib/saas/tenant-admin-access";

type SaveResult =
  | { ok: true; receipt: { auditId: string | null; savedAt: string; added: string[]; removed: string[]; unchanged: boolean; stateToken: string } }
  | { ok: false; error: string };

export async function saveTenantAdminAccessAction(input: {
  tenantId: string;
  adminUserId: string;
  roleId: string;
  grantIds: string[];
  stateToken: string;
}): Promise<SaveResult> {
  const session = await requireHostSession();
  const host = await prisma.user.findFirst({
    where: { id: session.userId, tenantId: null, isHostAdmin: true, isActive: true, userStatus: "ACTIVE" },
    select: { id: true, username: true },
  });
  if (!host) return { ok: false, error: "An active Host Administrator session is required." };

  const allowedIds = new Set(TENANT_ADMIN_ACCESS_GRANTS.map((grant) => grant.id));
  if (input.grantIds.some((id) => !allowedIds.has(id as TenantAdminAccessGrantId))) {
    return { ok: false, error: "The request contains a permission outside the Tenant Administrator allowlist." };
  }
  const desired = new Set(input.grantIds as TenantAdminAccessGrantId[]);

  try {
    const receipt = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findFirst({
        where: { id: input.tenantId, isActive: true, tenantStatus: { not: "ARCHIVED" } },
        select: { id: true, tenantCode: true },
      });
      if (!tenant) throw new Error("TENANT_NOT_AVAILABLE");

      const assignment = await tx.userRole.findFirst({
        where: {
          tenantId: tenant.id,
          userId: input.adminUserId,
          roleId: input.roleId,
          isActive: true,
          user: { tenantId: tenant.id, isHostAdmin: false, isActive: true },
          role: { tenantId: tenant.id, roleCode: { in: [...TENANT_ADMIN_ROLE_CODES] }, isActive: true },
        },
        select: { role: { select: { id: true, roleCode: true, permissions: { where: { isActive: true } } } } },
      });
      if (!assignment) throw new Error("ADMIN_ASSIGNMENT_CHANGED");

      const before = TENANT_ADMIN_ACCESS_GRANTS.filter((grant) => {
        const row = assignment.role.permissions.find((permission) => permission.resourceKey === grant.resourceKey);
        return Boolean(row?.[grant.action]);
      }).map((grant) => grant.id);
      const added = [...desired].filter((id) => !before.includes(id));
      const removed = before.filter((id) => !desired.has(id));
      const currentToken = permissionStateToken(assignment.role.permissions);
      if (added.length === 0 && removed.length === 0) {
        return { auditId: null, savedAt: new Date().toISOString(), added, removed, unchanged: true, stateToken: currentToken };
      }
      if (currentToken !== input.stateToken) throw new Error("STALE_PERMISSION_STATE");

      for (const resourceKey of new Set(TENANT_ADMIN_ACCESS_GRANTS.map((grant) => grant.resourceKey))) {
        const resource = TENANT_PERMISSION_RESOURCES.find((item) => item.resourceKey === resourceKey);
        if (!resource) throw new Error("ALLOWLIST_RESOURCE_MISSING");
        const grants = TENANT_ADMIN_ACCESS_GRANTS.filter((grant) => grant.resourceKey === resourceKey);
        const flags = Object.fromEntries(grants.map((grant) => [grant.action, desired.has(grant.id)]));
        await tx.permission.upsert({
          where: { roleId_resourceKey: { roleId: assignment.role.id, resourceKey } },
          create: {
            tenantId: tenant.id, roleId: assignment.role.id, resourceKey,
            permissionCode: resource.permissionCode, moduleCode: resource.moduleCode,
            canView: Boolean(flags.canView), canCreate: Boolean(flags.canCreate), canEdit: Boolean(flags.canEdit),
            canDelete: false, canApprove: Boolean(flags.canApprove), canPrint: false, createdBy: host.username, updatedBy: host.username,
          },
          update: {
            canView: Boolean(flags.canView), canCreate: Boolean(flags.canCreate), canEdit: Boolean(flags.canEdit),
            canDelete: false, canApprove: Boolean(flags.canApprove), canPrint: false, isActive: true, updatedBy: host.username,
          },
        });
      }
      await tx.role.update({ where: { id: assignment.role.id }, data: { updatedBy: host.username } });
      const audit = await tx.auditLog.create({
        data: {
          tenantId: tenant.id, userId: host.id, actionType: "UPDATE",
          entityType: "TenantAdministratorAccess", entityId: input.adminUserId, createdBy: host.username,
          changeData: { tenantCode: tenant.tenantCode, roleId: assignment.role.id, roleCode: assignment.role.roleCode, before, after: [...desired].sort(), added, removed },
        },
      });
      const afterRows = await tx.permission.findMany({ where: { roleId: assignment.role.id, isActive: true } });
      return { auditId: audit.id, savedAt: audit.createdAt.toISOString(), added, removed, unchanged: false, stateToken: permissionStateToken(afterRows) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath(`/host/tenants/${input.tenantId}`);
    revalidatePath("/host/audit");
    return { ok: true, receipt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "STALE_PERMISSION_STATE" || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")) {
      return { ok: false, error: "Permissions changed in another session. Reload the page and review before saving again." };
    }
    if (message === "TENANT_NOT_AVAILABLE") return { ok: false, error: "The tenant is not active or no longer available." };
    if (message === "ADMIN_ASSIGNMENT_CHANGED") return { ok: false, error: "The selected Tenant Administrator assignment is no longer valid." };
    return { ok: false, error: "Tenant Administrator access could not be saved." };
  }
}
