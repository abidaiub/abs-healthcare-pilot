import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  BillingCycle,
  ModuleStatus,
  OnboardingStatus,
  PackageType,
  SubscriptionStatus,
  TenantStatus,
  UserStatus,
} from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/lib/password";
import { SUBSCRIPTION_PACKAGES } from "../../src/lib/saas-foundation-data";

const HOST_ADMIN = {
  username: "admin.abs",
  email: "host@abshealthcare.local",
  password: "Host@2026!",
  roleCode: "HOST_ADMIN",
  roleName: "Host Admin",
};

const ABMG_ADMIN = {
  username: "laila.hasan",
  email: "laila.hasan@albarakamedical.com",
  phone: "+880 17 1111 0076",
  password: "Tenant@2026!",
  roleCode: "TENANT_ADMIN",
  roleName: "Primary Tenant Admin",
};

const ABMG_ENABLED_MODULES = new Set([
  "MOD-01",
  "MOD-02",
  "MOD-04",
  "MOD-06",
  "MOD-07",
  "MOD-10",
  "MOD-15",
  "MOD-17",
  "MOD-21",
  "MOD-22",
  "MOD-23",
  "MOD-24",
  "MOD-30",
]);

const PACKAGE_TYPE_MAP: Record<string, PackageType> = {
  Starter: "STARTER",
  Professional: "PROFESSIONAL",
  Enterprise: "ENTERPRISE",
  Custom: "ENTERPRISE",
};

export async function seedSaasFoundation(prisma: PrismaClient, tenantId: string) {
  await seedSubscriptionPackages(prisma);
  await seedHostAdmin(prisma);
  await seedAbmgTenantFoundation(prisma, tenantId);
}

async function seedSubscriptionPackages(prisma: PrismaClient) {
  for (const pkg of SUBSCRIPTION_PACKAGES) {
    await prisma.subscriptionPackage.upsert({
      where: { packageCode: pkg.code },
      update: {
        packageName: pkg.name,
        packageType: PACKAGE_TYPE_MAP[pkg.type] ?? "STANDARD",
        billingCycle: BillingCycle.MONTHLY,
        monthlyFee: pkg.monthlyFee,
        yearlyFee: pkg.yearlyFee,
        includedBranches: pkg.includedBranches,
        includedUsers: pkg.includedUsers,
        includedPatientsPerMonth: 5000,
        includedOrdersPerMonth: pkg.includedOrders,
        includedStorageGb: pkg.storageGb,
        supportLevel: pkg.supportLevel,
        isActive: pkg.status === "Active",
      },
      create: {
        packageCode: pkg.code,
        packageName: pkg.name,
        packageType: PACKAGE_TYPE_MAP[pkg.type] ?? "STANDARD",
        billingCycle: BillingCycle.MONTHLY,
        monthlyFee: pkg.monthlyFee,
        yearlyFee: pkg.yearlyFee,
        includedBranches: pkg.includedBranches,
        includedUsers: pkg.includedUsers,
        includedPatientsPerMonth: 5000,
        includedOrdersPerMonth: pkg.includedOrders,
        includedStorageGb: pkg.storageGb,
        supportLevel: pkg.supportLevel,
        isActive: pkg.status === "Active",
      },
    });
  }
}

async function seedHostAdmin(prisma: PrismaClient) {
  const passwordHash = hashPassword(HOST_ADMIN.password);

  let hostRole = await prisma.role.findFirst({
    where: { tenantId: null, roleCode: HOST_ADMIN.roleCode },
  });

  if (!hostRole) {
    hostRole = await prisma.role.create({
      data: {
        tenantId: null,
        roleCode: HOST_ADMIN.roleCode,
        roleName: HOST_ADMIN.roleName,
        description: "Platform host administrator",
      },
    });
  } else {
    hostRole = await prisma.role.update({
      where: { id: hostRole.id },
      data: { roleName: HOST_ADMIN.roleName, isActive: true },
    });
  }

  const hostUser = await prisma.user.upsert({
    where: { username: HOST_ADMIN.username },
    update: {
      email: HOST_ADMIN.email,
      passwordHash,
      isHostAdmin: true,
      tenantId: null,
      userStatus: UserStatus.ACTIVE,
      isActive: true,
    },
    create: {
      username: HOST_ADMIN.username,
      email: HOST_ADMIN.email,
      passwordHash,
      isHostAdmin: true,
      tenantId: null,
      userStatus: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: hostUser.id,
        roleId: hostRole.id,
      },
    },
    update: {
      isPrimary: true,
      isActive: true,
      tenantId: null,
    },
    create: {
      userId: hostUser.id,
      roleId: hostRole.id,
      tenantId: null,
      isPrimary: true,
    },
  });
}

async function seedAbmgTenantFoundation(prisma: PrismaClient, tenantId: string) {
  const proPackage = await prisma.subscriptionPackage.findUnique({
    where: { packageCode: "PKG-PRO" },
  });
  if (!proPackage) return;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      legalName: "Al Baraka Medical Group Ltd.",
      tradeLicenseNo: "TL-DHK-2018-45821",
      taxBinNo: "000123456-0101",
      district: "Dhaka",
      tenantStatus: TenantStatus.ACTIVE,
      onboardingStatus: OnboardingStatus.ACTIVE,
      logoUrl: "https://cdn.abshealthcare.local/abmg/logo.png",
      reportHeaderLogoUrl: "https://cdn.abshealthcare.local/abmg/report-header.png",
      reportFooterText: "Al Baraka Medical Group — Quality Healthcare for All",
    },
  });

  const subscriptionStart = new Date("2026-01-01T00:00:00.000Z");
  const subscriptionEnd = new Date("2026-12-31T23:59:59.000Z");
  const nextBillingDate = new Date("2026-07-01T00:00:00.000Z");

  const existingSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId, isActive: true },
  });

  if (!existingSub) {
    await prisma.tenantSubscription.create({
      data: {
        tenantId,
        packageId: proPackage.id,
        subscriptionStart,
        subscriptionEnd,
        billingCycle: BillingCycle.MONTHLY,
        subscriptionStatus: SubscriptionStatus.DUE,
        nextBillingDate,
        gracePeriodDays: 7,
        autoRenew: true,
      },
    });
  }

  await prisma.tenantUsageLimit.upsert({
    where: { tenantId },
    update: {
      maxBranches: 5,
      maxUsers: 50,
      maxPatientsPerMonth: 5000,
      maxOrdersPerMonth: 10000,
      maxReportsPerMonth: 8000,
      maxStorageGb: 100,
      maxSmsPerMonth: 2000,
      maxWhatsappPerMonth: 1000,
      maxApiCallsPerMonth: 50000,
      allowCustomDomain: false,
      allowApiAccess: true,
      allowPatientPortal: true,
      allowMultiBranch: true,
      allowReportBranding: true,
    },
    create: {
      tenantId,
      maxBranches: 5,
      maxUsers: 50,
      maxPatientsPerMonth: 5000,
      maxOrdersPerMonth: 10000,
      maxReportsPerMonth: 8000,
      maxStorageGb: 100,
      maxSmsPerMonth: 2000,
      maxWhatsappPerMonth: 1000,
      maxApiCallsPerMonth: 50000,
      allowCustomDomain: false,
      allowApiAccess: true,
      allowPatientPortal: true,
      allowMultiBranch: true,
      allowReportBranding: true,
    },
  });

  const modules = await prisma.moduleRegistry.findMany({
    where: { isActive: true },
  });

  const enabledFrom = new Date("2026-01-01T00:00:00.000Z");

  for (const mod of modules) {
    const enabled = ABMG_ENABLED_MODULES.has(mod.moduleCode);
    await prisma.tenantModule.upsert({
      where: {
        tenantId_moduleId: {
          tenantId,
          moduleId: mod.id,
        },
      },
      update: {
        isEnabled: enabled,
        moduleStatus: enabled ? ModuleStatus.ACTIVE : ModuleStatus.DISABLED,
      },
      create: {
        tenantId,
        moduleId: mod.id,
        isEnabled: enabled,
        enabledFrom,
        moduleStatus: enabled ? ModuleStatus.ACTIVE : ModuleStatus.DISABLED,
      },
    });
  }

  const tenantRole = await prisma.role.upsert({
    where: {
      tenantId_roleCode: {
        tenantId,
        roleCode: ABMG_ADMIN.roleCode,
      },
    },
    update: {
      roleName: ABMG_ADMIN.roleName,
      isActive: true,
    },
    create: {
      tenantId,
      roleCode: ABMG_ADMIN.roleCode,
      roleName: ABMG_ADMIN.roleName,
      description: "Primary tenant administrator",
    },
  });

  const adminPasswordHash = hashPassword(ABMG_ADMIN.password);
  const adminUser = await prisma.user.upsert({
    where: { username: ABMG_ADMIN.username },
    update: {
      email: ABMG_ADMIN.email,
      phone: ABMG_ADMIN.phone,
      passwordHash: adminPasswordHash,
      tenantId,
      isHostAdmin: false,
      userStatus: UserStatus.ACTIVE,
      isActive: true,
    },
    create: {
      username: ABMG_ADMIN.username,
      email: ABMG_ADMIN.email,
      phone: ABMG_ADMIN.phone,
      passwordHash: adminPasswordHash,
      tenantId,
      isHostAdmin: false,
      userStatus: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: tenantRole.id,
      },
    },
    update: {
      tenantId,
      isPrimary: true,
      isActive: true,
    },
    create: {
      userId: adminUser.id,
      roleId: tenantRole.id,
      tenantId,
      isPrimary: true,
    },
  });

  const historyCount = await prisma.statusHistory.count({
    where: { tenantId, entityType: "Tenant" },
  });

  if (historyCount === 0) {
    await prisma.statusHistory.createMany({
      data: [
        {
          tenantId,
          entityType: "Tenant",
          entityId: tenantId,
          oldStatus: "—",
          newStatus: "TRIAL",
          remarks: "New tenant onboarding",
          changedBy: HOST_ADMIN.username,
          changedAt: new Date("2025-12-15T10:00:00.000Z"),
        },
        {
          tenantId,
          entityType: "Tenant",
          entityId: tenantId,
          oldStatus: "TRIAL",
          newStatus: "ACTIVE",
          remarks: "Subscription activated — Professional Package",
          changedBy: HOST_ADMIN.username,
          changedAt: new Date("2026-01-01T09:30:00.000Z"),
        },
      ],
    });
  }

  console.log(
    `SaaS foundation seeded — host: ${HOST_ADMIN.username}, tenant admin: ${ABMG_ADMIN.username}`,
  );
}
