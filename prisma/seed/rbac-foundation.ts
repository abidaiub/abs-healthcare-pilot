import type { PrismaClient } from "../../src/generated/prisma/client";
import { UserStatus } from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/lib/password";
import {
  TENANT_ROLE_TEMPLATES,
  buildPermissionRowsFromTemplate,
} from "../../src/lib/saas/tenant-role-templates";
import { provisionStandardTenantAdminAccess } from "../../src/lib/saas/tenant-rbac-provisioning";

const SAMPLE_USERS = [
  {
    username: "arif.hossain",
    email: "arif.hossain@albarakamedical.com",
    phone: "+880 17 1111 0081",
    password: "Tenant@2026!",
    roleCode: "RECEPTION",
  },
  {
    username: "tania.sultana",
    email: "tania.sultana@albarakamedical.com",
    phone: "+880 17 1111 0082",
    password: "Tenant@2026!",
    roleCode: "LAB_TECH",
  },
  {
    username: "billing.ops",
    email: "billing.ops@albarakamedical.com",
    phone: "+880 17 1111 0083",
    password: "Tenant@2026!",
    roleCode: "BILLING",
  },
  {
    username: "amina.rahman",
    email: "amina.rahman@albarakamedical.com",
    phone: "+880 17 1111 0084",
    password: "Tenant@2026!",
    roleCode: "DOCTOR",
  },
] as const;

export async function seedTenantRbacFoundation(
  prisma: PrismaClient,
  tenantId: string,
  primaryBranchId: string,
) {
  const actor = "seed.rbac";
  const roleIds = new Map<string, string>();

  for (const seed of TENANT_ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_roleCode: {
          tenantId,
          roleCode: seed.roleCode,
        },
      },
      update: {
        roleName: seed.roleName,
        description: seed.description,
        isActive: true,
      },
      create: {
        tenantId,
        roleCode: seed.roleCode,
        roleName: seed.roleName,
        description: seed.description,
        createdBy: actor,
        updatedBy: actor,
      },
    });

    roleIds.set(seed.roleCode, role.id);

    for (const permission of buildPermissionRowsFromTemplate(
      tenantId,
      role.id,
      seed,
      actor,
    )) {
      await prisma.permission.upsert({
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
    }
  }

  const tenantAdminRoleId = roleIds.get("TENANT_ADMIN");
  if (tenantAdminRoleId) {
    // Ensure the standard allowlist flags exist even on fullAccess seed admins.
    await provisionStandardTenantAdminAccess(prisma, {
      tenantId,
      roleId: tenantAdminRoleId,
      actor,
      writeAudit: false,
    });
  }

  const adminUser = await prisma.user.findFirst({
    where: { tenantId, username: "laila.hasan" },
    select: { id: true },
  });

  if (adminUser && tenantAdminRoleId) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: tenantAdminRoleId,
        },
      },
      update: {
        tenantId,
        isPrimary: true,
        isActive: true,
      },
      create: {
        tenantId,
        userId: adminUser.id,
        roleId: tenantAdminRoleId,
        isPrimary: true,
        createdBy: actor,
        updatedBy: actor,
      },
    });

    await prisma.userBranch.upsert({
      where: {
        userId_branchId: {
          userId: adminUser.id,
          branchId: primaryBranchId,
        },
      },
      update: {
        tenantId,
        isPrimary: true,
        isActive: true,
      },
      create: {
        tenantId,
        userId: adminUser.id,
        branchId: primaryBranchId,
        isPrimary: true,
        createdBy: actor,
        updatedBy: actor,
      },
    });
  }

  for (const sample of SAMPLE_USERS) {
    const roleId = roleIds.get(sample.roleCode);
    if (!roleId) continue;

    const passwordHash = hashPassword(sample.password);
    const user = await prisma.user.upsert({
      where: { username: sample.username },
      update: {
        email: sample.email,
        phone: sample.phone,
        passwordHash,
        tenantId,
        isHostAdmin: false,
        userStatus: UserStatus.ACTIVE,
        isActive: true,
      },
      create: {
        username: sample.username,
        email: sample.email,
        phone: sample.phone,
        passwordHash,
        tenantId,
        isHostAdmin: false,
        userStatus: UserStatus.ACTIVE,
        createdBy: actor,
        updatedBy: actor,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId,
        },
      },
      update: {
        tenantId,
        isPrimary: true,
        isActive: true,
      },
      create: {
        tenantId,
        userId: user.id,
        roleId,
        isPrimary: true,
        createdBy: actor,
        updatedBy: actor,
      },
    });

    await prisma.userBranch.upsert({
      where: {
        userId_branchId: {
          userId: user.id,
          branchId: primaryBranchId,
        },
      },
      update: {
        tenantId,
        isPrimary: true,
        isActive: true,
      },
      create: {
        tenantId,
        userId: user.id,
        branchId: primaryBranchId,
        isPrimary: true,
        createdBy: actor,
        updatedBy: actor,
      },
    });
  }

  console.log(
    `RBAC foundation seeded — roles: ${TENANT_ROLE_TEMPLATES.length}, sample users: ${SAMPLE_USERS.length}`,
  );
}
