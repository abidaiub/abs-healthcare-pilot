/**
 * Layer 1 SaaS Foundation — UI mock data only.
 * Aligned with Sample Data Dictionary v2.0 and Phase 2 Diagnostic Schema Design rev.2.
 */

export type TenantStatus =
  | "Active"
  | "Trial"
  | "Suspended"
  | "Expired"
  | "Archived";

export type OnboardingStatus =
  | "Draft"
  | "Provisioning"
  | "Ready"
  | "Live";

export type TenantType =
  | "Hospital"
  | "Diagnostic Center"
  | "Clinic Network"
  | "Multi-Specialty";

export type DeploymentMode = "Shared" | "Dedicated" | "On-Premise";
export type DeploymentStatus = "Pending" | "Deploying" | "Live" | "Failed";
export type BillingCycle = "Monthly" | "Yearly" | "Quarterly";
export type SubscriptionStatus = "Active" | "Trial" | "Overdue" | "Suspended" | "Expired";
export type ModuleAssignmentStatus = "Trial" | "Active" | "Expired" | "Disabled";
export type PackageType = "Starter" | "Professional" | "Enterprise" | "Custom";
export type BranchType = "Hospital" | "Diagnostic" | "Clinic" | "Collection Center";

export type SaasBranch = {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  branchType: BranchType;
  status: "Active" | "Inactive";
};

export type TenantBranding = {
  logoUrl: string;
  reportHeaderLogoUrl: string;
  reportFooterText: string;
};

export type TenantDeployment = {
  mode: DeploymentMode;
  subdomain: string;
  customDomain: string;
  appUrl: string;
  environment: "Production" | "Staging" | "UAT";
  status: DeploymentStatus;
};

export type TenantAdmin = {
  name: string;
  email: string;
  mobile: string;
  role: string;
  employeeCode: string;
};

export type TenantSubscription = {
  packageCode: string;
  packageName: string;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  status: SubscriptionStatus;
  dueAmount: number;
  gracePeriodDays: number;
  autoRenew: boolean;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
};

export type TenantUsageLimits = {
  maxBranches: number;
  maxUsers: number;
  maxPatientsPerMonth: number;
  maxOrdersPerMonth: number;
  maxReportsPerMonth: number;
  maxStorageGb: number;
  maxSms: number;
  maxWhatsapp: number;
  maxApiCalls: number;
  allowCustomDomain: boolean;
  allowApiAccess: boolean;
  allowPatientPortal: boolean;
  allowMultiBranch: boolean;
  allowReportBranding: boolean;
};

export type TenantModuleAssignment = {
  moduleCode: string;
  moduleName: string;
  moduleGroup: string;
  enabled: boolean;
  status: ModuleAssignmentStatus;
  enabledFrom: string;
  enabledTo: string;
  coreModule: boolean;
};

export type TenantStatusHistoryEntry = {
  oldStatus: TenantStatus | "—";
  newStatus: TenantStatus;
  reason: string;
  changedBy: string;
  changedAt: string;
};

export type SaasTenant = {
  id: string;
  code: string;
  name: string;
  legalName: string;
  tradeLicenseNo: string;
  taxBinNo: string;
  contactPerson: string;
  contactMobile: string;
  contactEmail: string;
  address: string;
  city: string;
  district: string;
  country: string;
  timezone: string;
  defaultLanguage: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  onboardingStatus: OnboardingStatus;
  hospitals: number;
  userCount: number;
  branding: TenantBranding;
  deployment: TenantDeployment;
  primaryAdmin: TenantAdmin;
  subscription: TenantSubscription;
  usageLimits: TenantUsageLimits;
  modules: TenantModuleAssignment[];
  statusHistory: TenantStatusHistoryEntry[];
  branches: SaasBranch[];
};

export type SubscriptionPackage = {
  code: string;
  name: string;
  type: PackageType;
  monthlyFee: number;
  yearlyFee: number;
  includedBranches: number;
  includedUsers: number;
  includedOrders: number;
  storageGb: number;
  supportLevel: string;
  status: "Active" | "Inactive";
  featureFlags: string[];
  defaultLimits: Partial<TenantUsageLimits>;
};

export type ModuleQcStatus = "PASS" | "FAIL" | "NOT RUN" | "NOT TESTED";

export type ModuleRegistryEntry = {
  moduleCode: string;
  moduleName: string;
  displayName?: string;
  moduleGroup: string;
  coreModule: boolean;
  status: "Active" | "Inactive" | "Deprecated";
  description: string;
  implementationStatus?: "Implemented" | "Planned" | "Deprecated";
  dependencies?: string[];
  capabilities?: string[];
  supportedLocales?: string[];
  verifyCommand?: string;
  docPath?: string;
  aiQcReportPath?: string;
  manualQcGuidePath?: string;
  manualQcResultTemplatePath?: string;
  implementationCommit?: string;
  automatedQcStatus?: ModuleQcStatus;
  manualQcStatus?: ModuleQcStatus;
  browserUatStatus?: ModuleQcStatus;
  productionApprovalStatus?: "Approved" | "Pending Manual QC" | "Blocked";
};

export type AuditLogEntry = {
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

export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    code: "PKG-STARTER",
    name: "Starter Diagnostic",
    type: "Starter",
    monthlyFee: 15000,
    yearlyFee: 150000,
    includedBranches: 1,
    includedUsers: 10,
    includedOrders: 2000,
    storageGb: 25,
    supportLevel: "Email",
    status: "Active",
    featureFlags: ["Patient Registration", "Diagnostic Billing", "Sample Collection"],
    defaultLimits: {
      maxBranches: 1,
      maxUsers: 10,
      maxOrdersPerMonth: 2000,
      allowPatientPortal: false,
      allowMultiBranch: false,
    },
  },
  {
    code: "PKG-PRO",
    name: "Professional Package",
    type: "Professional",
    monthlyFee: 45000,
    yearlyFee: 450000,
    includedBranches: 5,
    includedUsers: 50,
    includedOrders: 10000,
    storageGb: 100,
    supportLevel: "Priority Email + Phone",
    status: "Active",
    featureFlags: [
      "Full Diagnostic Chain",
      "Patient Portal",
      "Multi Branch",
      "Report Branding",
      "API Access",
    ],
    defaultLimits: {
      maxBranches: 5,
      maxUsers: 50,
      maxOrdersPerMonth: 10000,
      allowPatientPortal: true,
      allowMultiBranch: true,
      allowReportBranding: true,
      allowApiAccess: true,
    },
  },
  {
    code: "PKG-ENT",
    name: "Enterprise Hospital",
    type: "Enterprise",
    monthlyFee: 120000,
    yearlyFee: 1200000,
    includedBranches: 20,
    includedUsers: 200,
    includedOrders: 50000,
    storageGb: 500,
    supportLevel: "24/7 Dedicated",
    status: "Active",
    featureFlags: [
      "All Modules",
      "OPD/IPD",
      "Pharmacy",
      "Custom Domain",
      "Dedicated Deployment",
    ],
    defaultLimits: {
      maxBranches: 20,
      maxUsers: 200,
      maxOrdersPerMonth: 50000,
      allowCustomDomain: true,
      allowApiAccess: true,
      allowPatientPortal: true,
      allowMultiBranch: true,
      allowReportBranding: true,
    },
  },
];

const ABMG_MODULES: TenantModuleAssignment[] = [
  { moduleCode: "MOD-01", moduleName: "Company/Tenant", moduleGroup: "Foundation", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: true },
  { moduleCode: "MOD-02", moduleName: "User/RBAC", moduleGroup: "Foundation", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: true },
  { moduleCode: "MOD-04", moduleName: "Audit Center", moduleGroup: "Foundation", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: true },
  { moduleCode: "MOD-06", moduleName: "Localization Engine", moduleGroup: "Foundation", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: true },
  { moduleCode: "MOD-10", moduleName: "Service Catalog", moduleGroup: "Master Data", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-15", moduleName: "Patient Registration", moduleGroup: "Front Office", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-21", moduleName: "Sample Collection", moduleGroup: "Diagnostic", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-22", moduleName: "Result Entry", moduleGroup: "Diagnostic", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-23", moduleName: "Verification", moduleGroup: "Diagnostic", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-24", moduleName: "Report Release", moduleGroup: "Diagnostic", enabled: true, status: "Active", enabledFrom: "01-Jan-2026", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-30", moduleName: "Patient Portal", moduleGroup: "Portal", enabled: true, status: "Active", enabledFrom: "15-Jan-2026", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-17", moduleName: "OPD / Appointments", moduleGroup: "Clinical", enabled: false, status: "Disabled", enabledFrom: "—", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-28", moduleName: "IPD / Bed Management", moduleGroup: "Clinical", enabled: false, status: "Disabled", enabledFrom: "—", enabledTo: "—", coreModule: false },
  { moduleCode: "MOD-20", moduleName: "Pharmacy", moduleGroup: "Clinical", enabled: false, status: "Disabled", enabledFrom: "—", enabledTo: "—", coreModule: false },
];

export const SAAS_TENANTS: SaasTenant[] = [
  {
    id: "abmg",
    code: "ABMG",
    name: "Al Baraka Medical Group",
    legalName: "Al Baraka Medical Group Ltd.",
    tradeLicenseNo: "TL-DHK-2018-45821",
    taxBinNo: "000123456-0101",
    contactPerson: "Syed Asif Iqbal",
    contactMobile: "+880 17 2222 0001",
    contactEmail: "admin@albarakamedical.com",
    address: "12/A Dhanmondi, Dhaka 1209",
    city: "Dhaka",
    district: "Dhaka",
    country: "Bangladesh",
    timezone: "Asia/Dhaka",
    defaultLanguage: "EN",
    tenantType: "Multi-Specialty",
    tenantStatus: "Active",
    onboardingStatus: "Live",
    hospitals: 4,
    userCount: 48,
    branding: {
      logoUrl: "https://cdn.abshealthcare.local/abmg/logo.png",
      reportHeaderLogoUrl: "https://cdn.abshealthcare.local/abmg/report-header.png",
      reportFooterText: "Al Baraka Medical Group — Quality Healthcare for All",
    },
    deployment: {
      mode: "Shared",
      subdomain: "abmg",
      customDomain: "",
      appUrl: "https://abmg.abshealthcare.app",
      environment: "Production",
      status: "Live",
    },
    primaryAdmin: {
      name: "Laila Hasan",
      email: "laila.hasan@albarakamedical.com",
      mobile: "+880 17 1111 0076",
      role: "Primary Tenant Admin",
      employeeCode: "EMP-702",
    },
    subscription: {
      packageCode: "PKG-PRO",
      packageName: "Professional Package",
      billingCycle: "Monthly",
      startDate: "01-Jan-2026",
      endDate: "31-Dec-2026",
      nextBillingDate: "01-Jul-2026",
      status: "Overdue",
      dueAmount: 45000,
      gracePeriodDays: 7,
      autoRenew: true,
      lastPaymentDate: "01-Jun-2026",
      lastPaymentAmount: 45000,
    },
    usageLimits: {
      maxBranches: 5,
      maxUsers: 50,
      maxPatientsPerMonth: 5000,
      maxOrdersPerMonth: 10000,
      maxReportsPerMonth: 8000,
      maxStorageGb: 100,
      maxSms: 2000,
      maxWhatsapp: 1000,
      maxApiCalls: 50000,
      allowCustomDomain: false,
      allowApiAccess: true,
      allowPatientPortal: true,
      allowMultiBranch: true,
      allowReportBranding: true,
    },
    modules: ABMG_MODULES,
    statusHistory: [
      { oldStatus: "—", newStatus: "Trial", reason: "New tenant onboarding", changedBy: "Syed Asif Iqbal (Host)", changedAt: "15-Dec-2025 10:00" },
      { oldStatus: "Trial", newStatus: "Active", reason: "Subscription activated — Professional Package", changedBy: "Syed Asif Iqbal (Host)", changedAt: "01-Jan-2026 09:30" },
      { oldStatus: "Active", newStatus: "Active", reason: "Diagnostic modules enabled (MOD-21 to MOD-24)", changedBy: "Laila Hasan (ABMG)", changedAt: "05-Jan-2026 14:15" },
    ],
    branches: [
      { id: "br-dhk", code: "BR-DHK-01", name: "Dhaka Central Hospital", address: "12/A Dhanmondi, Dhaka 1209", city: "Dhaka", district: "Dhaka", phone: "+880 17 0000 0001", email: "dhaka@albarakamedical.com", branchType: "Hospital", status: "Active" },
      { id: "br-ctg", code: "BR-CTG-02", name: "Chattogram Medical Center", address: "45 GEC Circle, Chattogram 4000", city: "Chattogram", district: "Chattogram", phone: "+880 17 0000 0002", email: "ctg@albarakamedical.com", branchType: "Hospital", status: "Active" },
      { id: "br-bar", code: "BR-BAR-03", name: "Barishal Diagnostic Institute", address: "89 Sadar Road, Barishal 8200", city: "Barishal", district: "Barishal", phone: "+880 17 0000 0003", email: "barishal@albarakamedical.com", branchType: "Diagnostic", status: "Active" },
    ],
  },
  {
    id: "cchn",
    code: "CCHN",
    name: "CityCare Hospital Network",
    legalName: "CityCare Hospital Network Pvt. Ltd.",
    tradeLicenseNo: "TL-CTG-2020-11234",
    taxBinNo: "000987654-0202",
    contactPerson: "Moniruzzaman",
    contactMobile: "+880 17 2222 0077",
    contactEmail: "admin@citycarehospital.com",
    address: "45 GEC Circle, Chattogram 4000",
    city: "Chattogram",
    district: "Chattogram",
    country: "Bangladesh",
    timezone: "Asia/Dhaka",
    defaultLanguage: "EN",
    tenantType: "Hospital",
    tenantStatus: "Trial",
    onboardingStatus: "Provisioning",
    hospitals: 6,
    userCount: 12,
    branding: {
      logoUrl: "https://cdn.abshealthcare.local/cchn/logo.png",
      reportHeaderLogoUrl: "",
      reportFooterText: "CityCare Hospital Network",
    },
    deployment: {
      mode: "Shared",
      subdomain: "citycare",
      customDomain: "",
      appUrl: "https://citycare.abshealthcare.app",
      environment: "Production",
      status: "Deploying",
    },
    primaryAdmin: {
      name: "Moniruzzaman",
      email: "monir@citycarehospital.com",
      mobile: "+880 17 1111 0077",
      role: "Primary Tenant Admin",
      employeeCode: "EMP-801",
    },
    subscription: {
      packageCode: "PKG-STARTER",
      packageName: "Starter Diagnostic",
      billingCycle: "Monthly",
      startDate: "01-Jun-2026",
      endDate: "30-Jun-2026",
      nextBillingDate: "01-Jul-2026",
      status: "Trial",
      dueAmount: 0,
      gracePeriodDays: 14,
      autoRenew: false,
    },
    usageLimits: {
      maxBranches: 2,
      maxUsers: 10,
      maxPatientsPerMonth: 1000,
      maxOrdersPerMonth: 2000,
      maxReportsPerMonth: 1500,
      maxStorageGb: 25,
      maxSms: 500,
      maxWhatsapp: 200,
      maxApiCalls: 5000,
      allowCustomDomain: false,
      allowApiAccess: false,
      allowPatientPortal: false,
      allowMultiBranch: true,
      allowReportBranding: false,
    },
    modules: ABMG_MODULES.map((m) => ({
      ...m,
      enabled: m.moduleCode.startsWith("MOD-0") || m.moduleCode === "MOD-10" || m.moduleCode === "MOD-15",
      status: m.moduleCode.startsWith("MOD-0") || m.moduleCode === "MOD-10" || m.moduleCode === "MOD-15" ? "Trial" as const : "Disabled" as const,
    })),
    statusHistory: [
      { oldStatus: "—", newStatus: "Trial", reason: "Trial provisioning started", changedBy: "Syed Asif Iqbal (Host)", changedAt: "10-Jun-2026 11:00" },
    ],
    branches: [
      { id: "br-dhk", code: "BR-DHK-01", name: "Dhaka Central Hospital", address: "12/A Dhanmondi, Dhaka 1209", city: "Dhaka", district: "Dhaka", phone: "+880 17 0000 0001", email: "dhaka@citycarehospital.com", branchType: "Hospital", status: "Active" },
      { id: "br-ctg", code: "BR-CTG-02", name: "Chattogram Medical Center", address: "45 GEC Circle, Chattogram 4000", city: "Chattogram", district: "Chattogram", phone: "+880 17 0000 0002", email: "ctg@citycarehospital.com", branchType: "Hospital", status: "Active" },
    ],
  },
  {
    id: "mpd",
    code: "MPD",
    name: "MedPlus Diagnostics",
    legalName: "MedPlus Diagnostics Ltd.",
    tradeLicenseNo: "TL-BAR-2019-33445",
    taxBinNo: "000555666-0303",
    contactPerson: "Habibur Rahman",
    contactMobile: "+880 17 2222 0073",
    contactEmail: "admin@medplusdiag.com",
    address: "89 Sadar Road, Barishal 8200",
    city: "Barishal",
    district: "Barishal",
    country: "Bangladesh",
    timezone: "Asia/Dhaka",
    defaultLanguage: "BN",
    tenantType: "Diagnostic Center",
    tenantStatus: "Suspended",
    onboardingStatus: "Live",
    hospitals: 3,
    userCount: 8,
    branding: {
      logoUrl: "https://cdn.abshealthcare.local/mpd/logo.png",
      reportHeaderLogoUrl: "https://cdn.abshealthcare.local/mpd/report-header.png",
      reportFooterText: "MedPlus Diagnostics — Accurate. Fast. Reliable.",
    },
    deployment: {
      mode: "Shared",
      subdomain: "medplus",
      customDomain: "",
      appUrl: "https://medplus.abshealthcare.app",
      environment: "Production",
      status: "Live",
    },
    primaryAdmin: {
      name: "Habibur Rahman",
      email: "habib@medplusdiag.com",
      mobile: "+880 17 1111 0073",
      role: "Primary Tenant Admin",
      employeeCode: "EMP-901",
    },
    subscription: {
      packageCode: "PKG-STARTER",
      packageName: "Starter Diagnostic",
      billingCycle: "Monthly",
      startDate: "01-Mar-2026",
      endDate: "31-May-2026",
      nextBillingDate: "01-Jun-2026",
      status: "Suspended",
      dueAmount: 30000,
      gracePeriodDays: 7,
      autoRenew: true,
      lastPaymentDate: "01-Apr-2026",
      lastPaymentAmount: 15000,
    },
    usageLimits: {
      maxBranches: 1,
      maxUsers: 10,
      maxPatientsPerMonth: 1000,
      maxOrdersPerMonth: 2000,
      maxReportsPerMonth: 1500,
      maxStorageGb: 25,
      maxSms: 500,
      maxWhatsapp: 200,
      maxApiCalls: 5000,
      allowCustomDomain: false,
      allowApiAccess: false,
      allowPatientPortal: false,
      allowMultiBranch: false,
      allowReportBranding: true,
    },
    modules: ABMG_MODULES.map((m) => ({
      ...m,
      enabled: false,
      status: "Disabled" as const,
    })),
    statusHistory: [
      { oldStatus: "—", newStatus: "Active", reason: "Tenant onboarded", changedBy: "Syed Asif Iqbal (Host)", changedAt: "01-Mar-2026 09:00" },
      { oldStatus: "Active", newStatus: "Suspended", reason: "Payment overdue — 2 months", changedBy: "Syed Asif Iqbal (Host)", changedAt: "15-May-2026 16:45" },
    ],
    branches: [
      { id: "br-bar", code: "BR-BAR-03", name: "Barishal Diagnostic Institute", address: "89 Sadar Road, Barishal 8200", city: "Barishal", district: "Barishal", phone: "+880 17 0000 0003", email: "barishal@medplusdiag.com", branchType: "Diagnostic", status: "Active" },
    ],
  },
];

export const MODULE_REGISTRY: ModuleRegistryEntry[] = [
  { moduleCode: "MOD-01", moduleName: "Company/Tenant Management", moduleGroup: "Foundation", coreModule: true, status: "Active", description: "Tenant lifecycle, branding, deployment" },
  { moduleCode: "MOD-02", moduleName: "User Management & RBAC", moduleGroup: "Foundation", coreModule: true, status: "Active", description: "Users, roles, permissions" },
  { moduleCode: "MOD-04", moduleName: "Audit Center", moduleGroup: "Foundation", coreModule: true, status: "Active", description: "Immutable audit trail" },
  {
    moduleCode: "MOD-06",
    moduleName: "Localization Engine",
    displayName: "Localization",
    moduleGroup: "Foundation",
    coreModule: true,
    status: "Active",
    description: "Tenant-aware localization, language switching, RTL, and formatting",
    implementationStatus: "Implemented",
    dependencies: ["MOD-01", "MOD-01A", "MOD-02", "MOD-03"],
    capabilities: [
      "Tenant-aware locale resolution",
      "User language preference",
      "Tenant-supported locale restriction",
      "Translation dictionaries",
      "Language switcher",
      "RTL rendering",
      "Localized navigation and validation",
      "Tenant-aware date, number, and currency formatting",
      "English fallback",
    ],
    supportedLocales: ["en-BD", "bn-BD", "ar-SA", "ur-PK", "hi-IN"],
    verifyCommand: "npm run verify:mod06",
    docPath: "docs/modules/MOD-06-Localization.md",
    aiQcReportPath: "docs/AI-QC/reports/006-Localization-AI-QC-v1.0.md",
    manualQcGuidePath: "docs/AI-QC/manual-qc/source/006-Localization-Manual-QC-v1.0.md",
    manualQcResultTemplatePath:
      "docs/AI-QC/manual-qc/results/006-Localization-Manual-QC-Result-Template.md",
    implementationCommit: "a8ee1fc",
    automatedQcStatus: "PASS",
    manualQcStatus: "NOT TESTED",
    browserUatStatus: "NOT TESTED",
    productionApprovalStatus: "Pending Manual QC",
  },
  { moduleCode: "MOD-10", moduleName: "Master Service Catalog", moduleGroup: "Master Data", coreModule: false, status: "Active", description: "Host + tenant service catalog" },
  { moduleCode: "MOD-15", moduleName: "Patient Registration & MPI", moduleGroup: "Front Office", coreModule: false, status: "Active", description: "Patient demographics and search" },
  { moduleCode: "MOD-17", moduleName: "Appointment Management", moduleGroup: "Clinical", coreModule: false, status: "Active", description: "OPD appointments and queue" },
  { moduleCode: "MOD-20", moduleName: "Pharmacy & Medication Catalog", moduleGroup: "Clinical", coreModule: false, status: "Active", description: "Pharmacy POS and dispensing" },
  { moduleCode: "MOD-21", moduleName: "Sample Collection & Lab Workflow", moduleGroup: "Diagnostic", coreModule: false, status: "Active", description: "Phlebotomy and sample lifecycle" },
  { moduleCode: "MOD-22", moduleName: "Result Entry & Analyzer Integration", moduleGroup: "Diagnostic", coreModule: false, status: "Active", description: "LIS and manual result entry" },
  { moduleCode: "MOD-23", moduleName: "Result Verification & Approval", moduleGroup: "Diagnostic", coreModule: false, status: "Active", description: "Pathologist verification" },
  { moduleCode: "MOD-24", moduleName: "Report Release & Delivery", moduleGroup: "Diagnostic", coreModule: false, status: "Active", description: "Print, PDF, portal release" },
  { moduleCode: "MOD-28", moduleName: "Bed/Ward/Room Occupancy", moduleGroup: "Clinical", coreModule: false, status: "Active", description: "IPD bed management" },
  { moduleCode: "MOD-30", moduleName: "Patient Portal & Self Service", moduleGroup: "Portal", coreModule: false, status: "Active", description: "Patient self-service reports" },
];

export const AUDIT_LOG_ENTRIES: AuditLogEntry[] = [
  { id: "AUD-001", time: "18-Jun-2026 09:15:22", tenantCode: "ABMG", tenantName: "Al Baraka Medical Group", branchCode: "BR-DHK-01", user: "Laila Hasan (EMP-702)", action: "UPDATE", entity: "TenantModule", oldValue: "MOD-30: Disabled", newValue: "MOD-30: Active", ipAddress: "103.120.45.10" },
  { id: "AUD-002", time: "18-Jun-2026 08:42:05", tenantCode: "ABMG", tenantName: "Al Baraka Medical Group", branchCode: "—", user: "Syed Asif Iqbal (Host)", action: "UPDATE", entity: "TenantSubscription", oldValue: "dueAmount: 0", newValue: "dueAmount: 45000", ipAddress: "192.168.1.10" },
  { id: "AUD-003", time: "17-Jun-2026 16:30:11", tenantCode: "CCHN", tenantName: "CityCare Hospital Network", branchCode: "—", user: "Syed Asif Iqbal (Host)", action: "INSERT", entity: "Tenant", oldValue: "—", newValue: "CCHN — Trial", ipAddress: "192.168.1.10" },
  { id: "AUD-004", time: "15-May-2026 16:45:33", tenantCode: "MPD", tenantName: "MedPlus Diagnostics", branchCode: "—", user: "Syed Asif Iqbal (Host)", action: "UPDATE", entity: "TenantStatus", oldValue: "Active", newValue: "Suspended", ipAddress: "192.168.1.10" },
  { id: "AUD-005", time: "05-Jan-2026 14:15:08", tenantCode: "ABMG", tenantName: "Al Baraka Medical Group", branchCode: "BR-DHK-01", user: "Laila Hasan (EMP-702)", action: "UPDATE", entity: "TenantUsageLimit", oldValue: "maxUsers: 30", newValue: "maxUsers: 50", ipAddress: "103.120.45.10" },
  { id: "AUD-006", time: "01-Jan-2026 09:30:44", tenantCode: "ABMG", tenantName: "Al Baraka Medical Group", branchCode: "—", user: "Syed Asif Iqbal (Host)", action: "UPDATE", entity: "TenantStatus", oldValue: "Trial", newValue: "Active", ipAddress: "192.168.1.10" },
  { id: "AUD-007", time: "01-Jan-2026 09:28:12", tenantCode: "ABMG", tenantName: "Al Baraka Medical Group", branchCode: "—", user: "Syed Asif Iqbal (Host)", action: "INSERT", entity: "TenantAdminAssignment", oldValue: "—", newValue: "Laila Hasan — Primary Admin", ipAddress: "192.168.1.10" },
  { id: "AUD-008", time: "18-Jun-2026 10:05:00", tenantCode: "—", tenantName: "Host Platform", branchCode: "—", user: "Syed Asif Iqbal (Host)", action: "LOGIN", entity: "HostSession", oldValue: "—", newValue: "Success", ipAddress: "192.168.1.10" },
];

export function getSaasTenantById(id: string) {
  return SAAS_TENANTS.find((t) => t.id === id);
}

export function getSaasTenantByCode(code: string) {
  return SAAS_TENANTS.find((t) => t.code === code);
}

export function getHostDashboardKpis() {
  const total = SAAS_TENANTS.length;
  const active = SAAS_TENANTS.filter((t) => t.tenantStatus === "Active").length;
  const trial = SAAS_TENANTS.filter((t) => t.tenantStatus === "Trial").length;
  const suspended = SAAS_TENANTS.filter((t) => t.tenantStatus === "Suspended").length;
  const monthlyRevenue = SAAS_TENANTS.reduce((sum, t) => {
    if (t.subscription.status === "Active" || t.subscription.status === "Overdue") {
      return sum + (t.subscription.lastPaymentAmount ?? t.subscription.dueAmount);
    }
    return sum;
  }, 0);
  const dueAmount = SAAS_TENANTS.reduce((sum, t) => sum + t.subscription.dueAmount, 0);
  const enabledModules = MODULE_REGISTRY.filter((m) => m.status === "Active").length;
  const activeSubscriptions = SAAS_TENANTS.filter(
    (t) => t.subscription.status === "Active" || t.subscription.status === "Overdue",
  ).length;

  return {
    totalTenants: total,
    activeTenants: active,
    trialTenants: trial,
    suspendedTenants: suspended,
    monthlyRevenue,
    dueAmount,
    enabledModules,
    activeSubscriptions,
  };
}

export function formatBdt(amount: number) {
  return `BDT ${amount.toLocaleString("en-BD")}`;
}

export function getStatusBadgeVariant(
  status: TenantStatus | SubscriptionStatus | ModuleAssignmentStatus,
): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "Active":
      return "success";
    case "Trial":
      return "info";
    case "Overdue":
    case "Suspended":
      return "danger";
    case "Expired":
    case "Archived":
    case "Disabled":
      return "default";
    default:
      return "default";
  }
}
