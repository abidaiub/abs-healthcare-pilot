import type { PrismaClient } from "../../src/generated/prisma/client";
import { UserStatus } from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/lib/password";
import {
  TENANT_PERMISSION_RESOURCES,
  type PermissionAction,
} from "../../src/lib/rbac/permission-catalog";

type RoleSeed = {
  roleCode: string;
  roleName: string;
  description: string;
  fullAccess?: boolean;
  resourceKeys?: string[];
  actions?: PermissionAction[];
};

const TENANT_ROLE_SEEDS: RoleSeed[] = [
  {
    roleCode: "TENANT_ADMIN",
    roleName: "Primary Tenant Admin",
    description: "Full tenant administration including users, roles, and setup",
    fullAccess: true,
  },
  {
    roleCode: "RECEPTION",
    roleName: "Reception",
    description: "Front desk registration, search, and billing",
    resourceKeys: [
      "/dashboard",
      "/patients",
      "/patients/new",
      "/appointments",
      "/appointments/new",
      "/appointments/queue",
      "/appointments/queue/operator",
      "/consultations",
      "/prescriptions",
      "/diagnostic/billing",
    ],
    actions: ["canView", "canCreate", "canEdit", "canPrint"],
  },
  {
    roleCode: "DOCTOR",
    roleName: "Doctor",
    description: "Clinical consultation and encounter documentation",
    resourceKeys: [
      "/doctor/worklist",
      "/consultations",
      "/consultations/start",
      "/consultations/edit",
      "/consultations/vitals",
      "/consultations/complete",
      "/consultations/print",
      "/prescriptions",
      "/prescriptions/new",
      "/prescriptions/edit",
      "/prescriptions/finalize",
      "/prescriptions/cancel",
      "/prescriptions/revise",
      "/prescriptions/print",
      "/prescriptions/history",
      "/pharmacy/medications/search",
    ],
    actions: ["canView", "canCreate", "canEdit", "canPrint"],
  },
  {
    roleCode: "PHARMACIST",
    roleName: "Pharmacist",
    description: "Medication catalog and branch availability management",
    resourceKeys: [
      "/pharmacy/medications",
      "/pharmacy/medications/new",
      "/pharmacy/medications/edit",
      "/pharmacy/generics",
      "/pharmacy/manufacturers",
      "/pharmacy/reference-data",
      "/pharmacy/branch-availability",
      "/pharmacy/import",
      "/pharmacy/medications/search",
    ],
    actions: ["canView", "canCreate", "canEdit", "canPrint"],
  },
  {
    roleCode: "PHLEBOTOMIST",
    roleName: "Phlebotomist",
    description: "Sample collection and label printing",
    resourceKeys: [
      "/lab/orders",
      "/lab/orders/collect",
      "/lab/collection",
      "/lab/samples/label",
      "/lab/sample-collection",
      "/lab/label-print",
    ],
    actions: ["canView", "canEdit", "canPrint"],
  },
  {
    roleCode: "LAB_TECH",
    roleName: "Lab Technician",
    description: "Sample collection through report release workflow",
    resourceKeys: [
      "/lab/orders",
      "/lab/collection",
      "/lab/receipt",
      "/lab/processing",
      "/lab/orders/collect",
      "/lab/samples/label",
      "/lab/sample-collection",
      "/lab/label-print",
      "/lab/lis-worklist",
      "/lab/result-entry",
      "/lab/verification",
      "/lab/report-release",
    ],
    actions: ["canView", "canCreate", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "BILLING",
    roleName: "Billing",
    description: "Diagnostic billing and test orders",
    resourceKeys: ["/dashboard", "/diagnostic/billing"],
    actions: ["canView", "canCreate", "canEdit", "canPrint"],
  },
];

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

function buildPermissionPayload(
  tenantId: string,
  roleId: string,
  seed: RoleSeed,
  actor: string,
) {
  const actions: PermissionAction[] = seed.actions ?? [
    "canView",
    "canCreate",
    "canEdit",
    "canDelete",
    "canApprove",
    "canPrint",
  ];

  const resources = seed.fullAccess
    ? TENANT_PERMISSION_RESOURCES
    : TENANT_PERMISSION_RESOURCES.filter((resource) =>
        seed.resourceKeys?.includes(resource.resourceKey),
      );

  return resources.map((resource) => ({
    tenantId,
    roleId,
    permissionCode: resource.permissionCode,
    moduleCode: resource.moduleCode,
    resourceKey: resource.resourceKey,
    canView: actions.includes("canView"),
    canCreate: actions.includes("canCreate"),
    canEdit: actions.includes("canEdit"),
    canDelete: actions.includes("canDelete"),
    canApprove: actions.includes("canApprove"),
    canPrint: actions.includes("canPrint"),
    createdBy: actor,
    updatedBy: actor,
  }));
}

export async function seedTenantRbacFoundation(
  prisma: PrismaClient,
  tenantId: string,
  primaryBranchId: string,
) {
  const actor = "seed.rbac";
  const roleIds = new Map<string, string>();

  for (const seed of TENANT_ROLE_SEEDS) {
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

    for (const permission of buildPermissionPayload(tenantId, role.id, seed, actor)) {
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

  const adminUser = await prisma.user.findFirst({
    where: { tenantId, username: "laila.hasan" },
    select: { id: true },
  });

  const tenantAdminRoleId = roleIds.get("TENANT_ADMIN");
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
    `RBAC foundation seeded — roles: ${TENANT_ROLE_SEEDS.length}, sample users: ${SAMPLE_USERS.length}`,
  );
}
