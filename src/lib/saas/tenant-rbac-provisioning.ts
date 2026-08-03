import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { TENANT_PERMISSION_RESOURCES } from "@/lib/rbac/permission-catalog";
import {
  RECOMMENDED_TENANT_ADMIN_GRANT_IDS,
  TENANT_ADMIN_ACCESS_GRANTS,
  TENANT_ADMIN_ROLE_CODES,
  type TenantAdminAccessGrantId,
} from "@/lib/saas/tenant-admin-access";
import { SUGGESTED_DEPARTMENTS } from "@/lib/operational-readiness/constants";
import {
  OPERATIONAL_ROLE_TEMPLATES,
  TENANT_ADMIN_CLINICAL_SOD_DENIES,
  buildPermissionRowsFromTemplate,
} from "@/lib/saas/tenant-role-templates";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type ProvisionResult = {
  tenantId: string;
  adminRoleId: string | null;
  grantsAdded: TenantAdminAccessGrantId[];
  rolesCreated: string[];
  rolesUpdated: string[];
  permissionsUpserted: number;
  sodDeniesApplied: number;
};

function resourceCatalog(resourceKey: string) {
  const resource = TENANT_PERMISSION_RESOURCES.find((item) => item.resourceKey === resourceKey);
  if (!resource) {
    throw new Error(`ALLOWLIST_RESOURCE_MISSING:${resourceKey}`);
  }
  return resource;
}

/**
 * Additive upsert of the recommended Tenant Admin user-management allowlist.
 * Does not strip unrelated permissions (e.g. seed fullAccess extras).
 */
export async function provisionStandardTenantAdminAccess(
  db: DbClient,
  input: {
    tenantId: string;
    roleId: string;
    actor: string;
    grantIds?: readonly TenantAdminAccessGrantId[];
    writeAudit?: boolean;
  },
): Promise<{ grantsAdded: TenantAdminAccessGrantId[]; permissionsUpserted: number }> {
  const desired = new Set(input.grantIds ?? RECOMMENDED_TENANT_ADMIN_GRANT_IDS);
  const existing = await db.permission.findMany({
    where: { roleId: input.roleId, isActive: true },
    select: {
      resourceKey: true,
      canView: true,
      canCreate: true,
      canEdit: true,
      canApprove: true,
    },
  });

  type AccessFlag = "canView" | "canCreate" | "canEdit" | "canApprove";
  const before = TENANT_ADMIN_ACCESS_GRANTS.filter((grant) => {
    const row = existing.find((permission) => permission.resourceKey === grant.resourceKey);
    const action = grant.action as AccessFlag;
    return Boolean(row?.[action]);
  }).map((grant) => grant.id);

  const grantsAdded = [...desired].filter((id) => !before.includes(id));
  let permissionsUpserted = 0;

  for (const resourceKey of new Set(TENANT_ADMIN_ACCESS_GRANTS.map((grant) => grant.resourceKey))) {
    const resource = resourceCatalog(resourceKey);
    const grants = TENANT_ADMIN_ACCESS_GRANTS.filter((grant) => grant.resourceKey === resourceKey);
    const current = existing.find((row) => row.resourceKey === resourceKey);
    const flags: Record<AccessFlag, boolean> = {
      canView: Boolean(current?.canView),
      canCreate: Boolean(current?.canCreate),
      canEdit: Boolean(current?.canEdit),
      canApprove: Boolean(current?.canApprove),
    };
    for (const grant of grants) {
      if (desired.has(grant.id)) {
        flags[grant.action as AccessFlag] = true;
      }
    }

    await db.permission.upsert({
      where: {
        roleId_resourceKey: {
          roleId: input.roleId,
          resourceKey,
        },
      },
      create: {
        tenantId: input.tenantId,
        roleId: input.roleId,
        resourceKey,
        permissionCode: resource.permissionCode,
        moduleCode: resource.moduleCode,
        canView: flags.canView,
        canCreate: flags.canCreate,
        canEdit: flags.canEdit,
        canDelete: false,
        canApprove: flags.canApprove,
        canPrint: false,
        createdBy: input.actor,
        updatedBy: input.actor,
      },
      update: {
        canView: flags.canView,
        canCreate: flags.canCreate,
        canEdit: flags.canEdit,
        canApprove: flags.canApprove,
        isActive: true,
        updatedBy: input.actor,
        permissionCode: resource.permissionCode,
        moduleCode: resource.moduleCode,
      },
    });
    permissionsUpserted += 1;
  }

  if (input.writeAudit !== false && grantsAdded.length > 0) {
    await db.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actionType: "UPDATE",
        entityType: "TenantAdministratorAccess",
        entityId: input.roleId,
        createdBy: input.actor,
        changeData: {
          event: "STANDARD_TENANT_ADMIN_ACCESS_PROVISIONED",
          source: "tenant-rbac-provisioning",
          added: grantsAdded,
          after: [...desired].sort(),
        },
      },
    });
  }

  return { grantsAdded, permissionsUpserted };
}

export async function applyTenantAdminClinicalSodDenies(
  db: DbClient,
  input: { roleId: string; actor: string },
): Promise<number> {
  let applied = 0;
  for (const resourceKey of TENANT_ADMIN_CLINICAL_SOD_DENIES) {
    const result = await db.permission.updateMany({
      where: { roleId: input.roleId, resourceKey },
      data: { canApprove: false, updatedBy: input.actor },
    });
    applied += result.count;
  }
  return applied;
}

/**
 * Upsert standard operational roles + permission matrices (idempotent).
 * Skips TENANT_ADMIN — that role is provisioned via the allowlist helper.
 */
export async function provisionStandardOperationalRoles(
  db: DbClient,
  input: {
    tenantId: string;
    actor: string;
    writeAudit?: boolean;
  },
): Promise<{ rolesCreated: string[]; rolesUpdated: string[]; permissionsUpserted: number }> {
  const rolesCreated: string[] = [];
  const rolesUpdated: string[] = [];
  let permissionsUpserted = 0;

  for (const template of OPERATIONAL_ROLE_TEMPLATES) {
    const existing = await db.role.findFirst({
      where: { tenantId: input.tenantId, roleCode: template.roleCode },
      select: { id: true },
    });

    const role = await db.role.upsert({
      where: {
        tenantId_roleCode: {
          tenantId: input.tenantId,
          roleCode: template.roleCode,
        },
      },
      update: {
        roleName: template.roleName,
        description: template.description,
        isActive: true,
        updatedBy: input.actor,
      },
      create: {
        tenantId: input.tenantId,
        roleCode: template.roleCode,
        roleName: template.roleName,
        description: template.description,
        createdBy: input.actor,
        updatedBy: input.actor,
      },
    });

    if (existing) rolesUpdated.push(template.roleCode);
    else rolesCreated.push(template.roleCode);

    for (const permission of buildPermissionRowsFromTemplate(
      input.tenantId,
      role.id,
      template,
      input.actor,
    )) {
      await db.permission.upsert({
        where: {
          roleId_resourceKey: {
            roleId: role.id,
            resourceKey: permission.resourceKey,
          },
        },
        update: {
          ...permission,
          isActive: true,
        },
        create: permission,
      });
      permissionsUpserted += 1;
    }
  }

  if (input.writeAudit !== false && (rolesCreated.length > 0 || rolesUpdated.length > 0)) {
    await db.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actionType: "UPDATE",
        entityType: "TenantRbacProvision",
        entityId: input.tenantId,
        createdBy: input.actor,
        changeData: {
          event: "STANDARD_OPERATIONAL_ROLES_PROVISIONED",
          source: "tenant-rbac-provisioning",
          rolesCreated,
          rolesUpdated,
          permissionsUpserted,
        },
      },
    });
  }

  return { rolesCreated, rolesUpdated, permissionsUpserted };
}

/**
 * Ensure a first operating branch, assign it to the admin, and seed suggested departments.
 */
export async function provisionDefaultOperatingStructure(
  db: DbClient,
  input: {
    tenantId: string;
    adminUserId: string;
    actor: string;
    tenantCode: string;
    tenantName: string;
    city?: string | null;
    district?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  },
): Promise<{ branchId: string; departmentsCreated: number }> {
  let branch = await db.branch.findFirst({
    where: { tenantId: input.tenantId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!branch) {
    const code = `BR-${input.tenantCode.replace(/[^A-Z0-9]/gi, "").slice(0, 8) || "MAIN"}`;
    branch = await db.branch.create({
      data: {
        tenantId: input.tenantId,
        code: code.slice(0, 20),
        name: `${input.tenantName} – Main Branch`,
        address: input.address ?? null,
        city: input.city ?? null,
        district: input.district ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        isDefault: true,
        status: "ACTIVE",
        createdBy: input.actor,
        updatedBy: input.actor,
      },
      select: { id: true },
    });
  }

  await db.userBranch.upsert({
    where: {
      userId_branchId: {
        userId: input.adminUserId,
        branchId: branch.id,
      },
    },
    update: {
      tenantId: input.tenantId,
      isPrimary: true,
      isActive: true,
      updatedBy: input.actor,
    },
    create: {
      tenantId: input.tenantId,
      userId: input.adminUserId,
      branchId: branch.id,
      isPrimary: true,
      createdBy: input.actor,
      updatedBy: input.actor,
    },
  });

  let departmentsCreated = 0;
  for (const suggested of SUGGESTED_DEPARTMENTS) {
    const existing = await db.department.findFirst({
      where: {
        OR: [
          { tenantId: input.tenantId, deptCode: suggested.deptCode },
          { tenantId: null, deptCode: suggested.deptCode },
          {
            tenantId: input.tenantId,
            name: { equals: suggested.name, mode: "insensitive" },
          },
        ],
      },
      select: { id: true },
    });
    if (existing) continue;
    await db.department.create({
      data: {
        tenantId: input.tenantId,
        deptCode: suggested.deptCode,
        name: suggested.name,
        deptType: suggested.deptType,
        createdBy: input.actor,
        updatedBy: input.actor,
      },
    });
    departmentsCreated += 1;
  }

  return { branchId: branch.id, departmentsCreated };
}

export async function provisionTenantRbacBaseline(
  db: DbClient,
  input: {
    tenantId: string;
    adminRoleId: string;
    actor: string;
    writeAudit?: boolean;
    adminUserId?: string;
    tenantCode?: string;
    tenantName?: string;
    city?: string | null;
    district?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  },
): Promise<ProvisionResult> {
  const adminAccess = await provisionStandardTenantAdminAccess(db, {
    tenantId: input.tenantId,
    roleId: input.adminRoleId,
    actor: input.actor,
    writeAudit: input.writeAudit,
  });
  const sodDeniesApplied = await applyTenantAdminClinicalSodDenies(db, {
    roleId: input.adminRoleId,
    actor: input.actor,
  });
  const operational = await provisionStandardOperationalRoles(db, {
    tenantId: input.tenantId,
    actor: input.actor,
    writeAudit: input.writeAudit,
  });

  if (input.adminUserId && input.tenantCode && input.tenantName) {
    await provisionDefaultOperatingStructure(db, {
      tenantId: input.tenantId,
      adminUserId: input.adminUserId,
      actor: input.actor,
      tenantCode: input.tenantCode,
      tenantName: input.tenantName,
      city: input.city,
      district: input.district,
      address: input.address,
      phone: input.phone,
      email: input.email,
    });
  }

  return {
    tenantId: input.tenantId,
    adminRoleId: input.adminRoleId,
    grantsAdded: adminAccess.grantsAdded,
    rolesCreated: operational.rolesCreated,
    rolesUpdated: operational.rolesUpdated,
    permissionsUpserted:
      adminAccess.permissionsUpserted + operational.permissionsUpserted,
    sodDeniesApplied,
  };
}

export async function ensureTenantAdminRbacBaseline(
  db: DbClient,
  input: { tenantId: string; actor: string },
): Promise<ProvisionResult | null> {
  const tenant = await db.tenant.findFirst({
    where: { id: input.tenantId },
    select: {
      id: true,
      tenantCode: true,
      tenantName: true,
      city: true,
      district: true,
      address: true,
      contactMobile: true,
      contactEmail: true,
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
        select: { id: true },
      },
      roles: {
        where: {
          roleCode: { in: [...TENANT_ADMIN_ROLE_CODES] },
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  const adminRole = tenant?.roles[0];
  const adminUser = tenant?.users[0];
  if (!tenant || !adminRole) return null;

  return provisionTenantRbacBaseline(db, {
    tenantId: tenant.id,
    adminRoleId: adminRole.id,
    actor: input.actor,
    adminUserId: adminUser?.id,
    tenantCode: tenant.tenantCode,
    tenantName: tenant.tenantName,
    city: tenant.city,
    district: tenant.district,
    address: tenant.address,
    phone: tenant.contactMobile,
    email: tenant.contactEmail,
  });
}
