import type {
  BillingCycle,
  OnboardingStatus,
  TenantStatus,
  TenantType,
} from "@/generated/prisma/client";

export type TenantListRow = {
  id: string;
  code: string;
  name: string;
  tenantType: string;
  tenantStatus: string;
  onboardingStatus: string;
  subscriptionPackage: string;
  branchCount: number;
  userCount: number;
  dueAmount: number;
  deploymentStatus: string;
  primaryAdminName: string;
};

export type TenantBranchRow = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  isActive: boolean;
};

export type TenantModuleRow = {
  id: string;
  moduleCode: string;
  moduleName: string;
  moduleGroup: string;
  isEnabled: boolean;
  moduleStatus: string;
  enabledFrom: string;
  enabledTo: string;
  isCore: boolean;
};

export type TenantSubscriptionRow = {
  id: string;
  packageCode: string;
  packageName: string;
  billingCycle: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  nextBillingDate: string;
  subscriptionStatus: string;
  gracePeriodDays: number;
  autoRenew: boolean;
  dueAmount: number;
};

export type TenantUsageLimitRow = {
  maxBranches: number;
  maxUsers: number;
  maxPatientsPerMonth: number;
  maxOrdersPerMonth: number;
  maxReportsPerMonth: number;
  maxStorageGb: number;
  maxSmsPerMonth: number;
  maxWhatsappPerMonth: number;
  maxApiCallsPerMonth: number;
  allowCustomDomain: boolean;
  allowApiAccess: boolean;
  allowPatientPortal: boolean;
  allowMultiBranch: boolean;
  allowReportBranding: boolean;
};

export type TenantUsageSnapshotRow = {
  label: string;
  configured: number | string;
  measured: number | string | null;
  unit: string;
  state: "ok" | "near_limit" | "exceeded" | "not_measured";
};

export type TenantStatusHistoryRow = {
  id: string;
  oldStatus: string;
  newStatus: string;
  remarks: string | null;
  changedBy: string;
  changedAt: string;
};

export type TenantPrimaryAdminRow = {
  id: string | null;
  name: string;
  email: string;
  mobile: string | null;
  role: string;
};

export type TenantDetailRecord = {
  id: string;
  code: string;
  name: string;
  legalName: string | null;
  tradeLicenseNo: string | null;
  taxBinNo: string | null;
  contactPerson: string;
  contactMobile: string;
  contactEmail: string;
  address: string | null;
  city: string | null;
  district: string | null;
  country: string;
  timezone: string;
  defaultLanguage: string;
  tenantType: string;
  tenantStatus: string;
  onboardingStatus: string;
  branding: {
    logoUrl: string | null;
    reportHeaderLogoUrl: string | null;
    reportFooterText: string | null;
  };
  subscription: TenantSubscriptionRow | null;
  usageLimits: TenantUsageLimitRow | null;
  usageSnapshot: TenantUsageSnapshotRow[];
  modules: TenantModuleRow[];
  branches: TenantBranchRow[];
  statusHistory: TenantStatusHistoryRow[];
  primaryAdmin: TenantPrimaryAdminRow;
  userCount: number;
};

export type SubscriptionPackageRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  monthlyFee: number;
  yearlyFee: number;
  includedBranches: number;
  includedUsers: number;
  includedOrders: number;
  storageGb: number;
  supportLevel: string;
  status: string;
};

export type HostDashboardKpis = {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  monthlyRevenue: number;
  dueAmount: number;
  enabledModules: number;
  activeSubscriptions: number;
};

export type AuditLogRow = {
  id: string;
  time: string;
  tenantCode: string;
  tenantName: string;
  branchCode: string;
  user: string;
  action: string;
  entity: string;
  oldValue: string;
  newValue: string;
  ipAddress: string;
};

export type OnboardingStep = {
  id: string;
  label: string;
  state: "completed" | "pending" | "blocked";
  detail: string;
};

export type TenantFormValues = {
  tenantCode: string;
  tenantName: string;
  legalName?: string;
  tradeLicenseNo?: string;
  taxBinNo?: string;
  contactPerson: string;
  contactMobile: string;
  contactEmail: string;
  address?: string;
  city?: string;
  district?: string;
  country: string;
  timezone: string;
  defaultLanguage: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  onboardingStatus: OnboardingStatus;
  logoUrl?: string;
  reportHeaderLogoUrl?: string;
  reportFooterText?: string;
  packageId: string;
  billingCycle: BillingCycle;
  subscriptionStart: string;
  subscriptionEnd: string;
  gracePeriodDays: number;
  autoRenew: boolean;
  adminName: string;
  adminEmail: string;
  adminMobile?: string;
  adminPassword?: string;
};

export type TenantSettingsPayload = {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  logoUrl: string | null;
  reportHeaderLogoUrl: string | null;
  reportFooterText: string | null;
  defaultLanguage: string;
  timezone: string;
  contactPerson: string;
  contactMobile: string;
  contactEmail: string;
  address: string | null;
  city: string | null;
  district: string | null;
};
