import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  formatBillingCycle,
  formatDate,
  formatDateTime,
  formatModuleStatus,
  formatOnboardingStatus,
  formatSubscriptionStatus,
  formatTenantStatus,
  formatTenantType,
} from "@/lib/saas/format";
import type {
  AuditLogRow,
  HostDashboardKpis,
  SubscriptionPackageRow,
  TenantDetailRecord,
  TenantListRow,
  TenantSettingsPayload,
  TenantUsageSnapshotRow,
} from "@/lib/saas/types";

const tenantListInclude = {
  branches: { where: { isActive: true }, select: { id: true } },
  subscriptions: {
    where: { isActive: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { package: true },
  },
  users: {
    where: { isActive: true, isHostAdmin: false },
    include: {
      userRoles: { where: { isActive: true, isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
  _count: { select: { branches: true, users: true } },
} satisfies Prisma.TenantInclude;

const tenantDetailInclude = {
  branches: { orderBy: { name: "asc" as const } },
  subscriptions: {
    where: { isActive: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { package: true },
  },
  usageLimit: true,
  modules: {
    where: { isActive: true },
    include: { module: true },
    orderBy: { module: { moduleCode: "asc" as const } },
  },
  statusHistories: {
    where: { entityType: "Tenant", isActive: true },
    orderBy: { changedAt: "desc" as const },
    take: 20,
  },
  users: {
    where: { isActive: true, isHostAdmin: false },
    include: {
      userRoles: {
        where: { isActive: true, isPrimary: true },
        include: { role: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
  _count: { select: { users: { where: { isActive: true, isHostAdmin: false } } } },
} satisfies Prisma.TenantInclude;

export async function listTenantsForHost(): Promise<TenantListRow[]> {
  const tenants = await prisma.tenant.findMany({
    include: tenantListInclude,
    orderBy: { tenantName: "asc" },
  });

  return tenants.map((tenant) => {
    const sub = tenant.subscriptions[0];
    const adminUser = tenant.users[0];
    const dueAmount =
      sub?.subscriptionStatus === "DUE" ||
      sub?.subscriptionStatus === "GRACE_PERIOD"
        ? Number(sub.package.monthlyFee)
        : 0;

    return {
      id: tenant.id,
      code: tenant.tenantCode,
      name: tenant.tenantName,
      tenantType: formatTenantType(tenant.tenantType),
      tenantStatus: formatTenantStatus(tenant.tenantStatus),
      onboardingStatus: formatOnboardingStatus(tenant.onboardingStatus),
      subscriptionPackage: sub?.package.packageName ?? "—",
      branchCount: tenant._count.branches,
      userCount: tenant._count.users,
      dueAmount,
      deploymentStatus:
        tenant.onboardingStatus === "ACTIVE" ? "Live" : "Pending",
      primaryAdminName: adminUser?.username ?? "—",
    };
  });
}

export async function getTenantDetailById(
  tenantId: string,
): Promise<TenantDetailRecord | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: tenantDetailInclude,
  });

  if (!tenant) return null;

  const sub = tenant.subscriptions[0];
  const admin = tenant.users[0];
  const usageLimits = tenant.usageLimit;

  const usageSnapshot: TenantUsageSnapshotRow[] = usageLimits
    ? [
        {
          label: "Users",
          configured: usageLimits.maxUsers,
          measured: null,
          unit: "users",
          state: "not_measured",
        },
        {
          label: "Branches",
          configured: usageLimits.maxBranches,
          measured: tenant.branches.filter((b) => b.isActive).length,
          unit: "branches",
          state:
            tenant.branches.filter((b) => b.isActive).length >=
            usageLimits.maxBranches
              ? "near_limit"
              : "ok",
        },
        {
          label: "Orders / month",
          configured: usageLimits.maxOrdersPerMonth,
          measured: null,
          unit: "orders",
          state: "not_measured",
        },
        {
          label: "Reports / month",
          configured: usageLimits.maxReportsPerMonth,
          measured: null,
          unit: "reports",
          state: "not_measured",
        },
        {
          label: "Storage",
          configured: usageLimits.maxStorageGb,
          measured: null,
          unit: "GB",
          state: "not_measured",
        },
      ]
    : [];

  return {
    id: tenant.id,
    code: tenant.tenantCode,
    name: tenant.tenantName,
    legalName: tenant.legalName,
    tradeLicenseNo: tenant.tradeLicenseNo,
    taxBinNo: tenant.taxBinNo,
    contactPerson: tenant.contactPerson,
    contactMobile: tenant.contactMobile,
    contactEmail: tenant.contactEmail,
    address: tenant.address,
    city: tenant.city,
    district: tenant.district,
    country: tenant.country,
    timezone: tenant.timezone,
    defaultLanguage: tenant.defaultLanguage,
    tenantType: formatTenantType(tenant.tenantType),
    tenantStatus: formatTenantStatus(tenant.tenantStatus),
    onboardingStatus: formatOnboardingStatus(tenant.onboardingStatus),
    branding: {
      logoUrl: tenant.logoUrl,
      reportHeaderLogoUrl: tenant.reportHeaderLogoUrl,
      reportFooterText: tenant.reportFooterText,
    },
    subscription: sub
      ? {
          id: sub.id,
          packageCode: sub.package.packageCode,
          packageName: sub.package.packageName,
          billingCycle: formatBillingCycle(sub.billingCycle),
          subscriptionStart: formatDate(sub.subscriptionStart),
          subscriptionEnd: formatDate(sub.subscriptionEnd),
          nextBillingDate: formatDate(sub.nextBillingDate),
          subscriptionStatus: formatSubscriptionStatus(sub.subscriptionStatus),
          gracePeriodDays: sub.gracePeriodDays,
          autoRenew: sub.autoRenew,
          dueAmount:
            sub.subscriptionStatus === "DUE" ||
            sub.subscriptionStatus === "GRACE_PERIOD"
              ? Number(sub.package.monthlyFee)
              : 0,
        }
      : null,
    usageLimits: usageLimits
      ? {
          maxBranches: usageLimits.maxBranches,
          maxUsers: usageLimits.maxUsers,
          maxPatientsPerMonth: usageLimits.maxPatientsPerMonth,
          maxOrdersPerMonth: usageLimits.maxOrdersPerMonth,
          maxReportsPerMonth: usageLimits.maxReportsPerMonth,
          maxStorageGb: usageLimits.maxStorageGb,
          maxSmsPerMonth: usageLimits.maxSmsPerMonth,
          maxWhatsappPerMonth: usageLimits.maxWhatsappPerMonth,
          maxApiCallsPerMonth: usageLimits.maxApiCallsPerMonth,
          allowCustomDomain: usageLimits.allowCustomDomain,
          allowApiAccess: usageLimits.allowApiAccess,
          allowPatientPortal: usageLimits.allowPatientPortal,
          allowMultiBranch: usageLimits.allowMultiBranch,
          allowReportBranding: usageLimits.allowReportBranding,
        }
      : null,
    usageSnapshot,
    modules: tenant.modules.map((entry) => ({
      id: entry.id,
      moduleCode: entry.module.moduleCode,
      moduleName: entry.module.moduleName,
      moduleGroup: entry.module.moduleGroup,
      isEnabled: entry.isEnabled,
      moduleStatus: formatModuleStatus(entry.moduleStatus),
      enabledFrom: formatDate(entry.enabledFrom),
      enabledTo: formatDate(entry.enabledTo),
      isCore: entry.module.isCore,
    })),
    branches: tenant.branches.map((branch) => ({
      id: branch.id,
      code: branch.code,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      district: branch.district,
      phone: branch.phone,
      email: branch.email,
      status: branch.status === "ACTIVE" ? "Active" : branch.status === "INACTIVE" ? "Inactive" : "Archived",
      isActive: branch.isActive,
    })),
    statusHistory: tenant.statusHistories.map((entry) => ({
      id: entry.id,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      remarks: entry.remarks,
      changedBy: entry.changedBy,
      changedAt: formatDateTime(entry.changedAt),
    })),
    primaryAdmin: {
      id: admin?.id ?? null,
      name: admin?.username ?? "Not assigned",
      email: admin?.email ?? "—",
      mobile: admin?.phone ?? null,
      role: admin?.userRoles[0]?.role.roleName ?? "Tenant Admin",
    },
    userCount: tenant._count.users,
  };
}

export async function listSubscriptionPackages(): Promise<SubscriptionPackageRow[]> {
  const packages = await prisma.subscriptionPackage.findMany({
    where: { isActive: true },
    orderBy: { monthlyFee: "asc" },
  });

  return packages.map((pkg) => ({
    id: pkg.id,
    code: pkg.packageCode,
    name: pkg.packageName,
    type: pkg.packageType,
    monthlyFee: Number(pkg.monthlyFee),
    yearlyFee: Number(pkg.yearlyFee),
    includedBranches: pkg.includedBranches,
    includedUsers: pkg.includedUsers,
    includedOrders: pkg.includedOrdersPerMonth,
    storageGb: pkg.includedStorageGb,
    supportLevel: pkg.supportLevel,
    status: pkg.isActive ? "Active" : "Inactive",
  }));
}

export async function getHostDashboardKpis(): Promise<HostDashboardKpis> {
  const [tenants, modules, subscriptions, packages] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        subscriptions: {
          where: { isActive: true },
          include: { package: true },
        },
      },
    }),
    prisma.moduleRegistry.count({ where: { isActive: true } }),
    prisma.tenantSubscription.findMany({
      where: { isActive: true },
    }),
    prisma.subscriptionPackage.findMany({ where: { isActive: true } }),
  ]);

  const packageFeeMap = new Map(
    packages.map((pkg) => [pkg.id, Number(pkg.monthlyFee)]),
  );

  let monthlyRevenue = 0;
  let dueAmount = 0;

  for (const tenant of tenants) {
    const sub = tenant.subscriptions[0];
    if (!sub) continue;
    const fee = packageFeeMap.get(sub.packageId) ?? 0;
    if (sub.subscriptionStatus === "ACTIVE" || sub.subscriptionStatus === "TRIAL") {
      monthlyRevenue += fee;
    }
    if (
      sub.subscriptionStatus === "DUE" ||
      sub.subscriptionStatus === "GRACE_PERIOD"
    ) {
      dueAmount += fee;
    }
  }

  return {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((t) => t.tenantStatus === "ACTIVE").length,
    trialTenants: tenants.filter((t) => t.tenantStatus === "TRIAL").length,
    suspendedTenants: tenants.filter((t) => t.tenantStatus === "SUSPENDED")
      .length,
    monthlyRevenue,
    dueAmount,
    enabledModules: modules,
    activeSubscriptions: subscriptions.filter(
      (s) => s.subscriptionStatus === "ACTIVE" || s.subscriptionStatus === "TRIAL",
    ).length,
  };
}

export async function listAuditLogsForHost(options?: {
  tenantCode?: string;
  search?: string;
  limit?: number;
}): Promise<AuditLogRow[]> {
  const where: Prisma.AuditLogWhereInput = {};

  if (options?.tenantCode && options.tenantCode !== "All") {
    if (options.tenantCode === "—") {
      where.tenantId = null;
    } else {
      where.tenant = { tenantCode: options.tenantCode };
    }
  }

  if (options?.search?.trim()) {
    const q = options.search.trim();
    where.OR = [
      { entityType: { contains: q, mode: "insensitive" } },
      { createdBy: { contains: q, mode: "insensitive" } },
      { user: { username: { contains: q, mode: "insensitive" } } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      tenant: { select: { tenantCode: true, tenantName: true } },
      branch: { select: { code: true } },
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });

  return logs.map((log) => {
    const change = (log.changeData ?? {}) as Record<string, unknown>;
    return {
      id: log.id,
      time: formatDateTime(log.createdAt),
      tenantCode: log.tenant?.tenantCode ?? "—",
      tenantName: log.tenant?.tenantName ?? "Host Platform",
      branchCode: log.branch?.code ?? "—",
      user: log.user?.username ?? log.createdBy ?? "System",
      action: log.actionType,
      entity: log.entityType,
      oldValue: String(change.oldValue ?? "—"),
      newValue: String(change.newValue ?? JSON.stringify(change)),
      ipAddress: log.ipAddress ?? "—",
    };
  });
}

export async function getTenantSettingsPayload(
  tenantId: string,
): Promise<TenantSettingsPayload | null> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return null;

  return {
    tenantId: tenant.id,
    tenantCode: tenant.tenantCode,
    tenantName: tenant.tenantName,
    logoUrl: tenant.logoUrl,
    reportHeaderLogoUrl: tenant.reportHeaderLogoUrl,
    reportFooterText: tenant.reportFooterText,
    defaultLanguage: tenant.defaultLanguage,
    timezone: tenant.timezone,
    contactPerson: tenant.contactPerson,
    contactMobile: tenant.contactMobile,
    contactEmail: tenant.contactEmail,
    address: tenant.address,
    city: tenant.city,
    district: tenant.district,
  };
}

export async function assertHostCanAccessTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, tenantCode: true },
  });
  if (!tenant) {
    throw new Error("Tenant not found.");
  }
  return tenant;
}

export async function assertTenantOwnsBranch(tenantId: string, branchId: string) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId },
    select: { id: true, code: true, name: true },
  });
  if (!branch) {
    throw new Error("Branch not found for this tenant.");
  }
  return branch;
}
