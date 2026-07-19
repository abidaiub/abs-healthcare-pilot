import type {
  BillingCycle,
  EntityStatus,
  ModuleStatus,
  OnboardingStatus,
  SubscriptionStatus,
  TenantStatus,
  TenantType,
} from "@/generated/prisma/client";

export function formatTenantStatus(status: TenantStatus): string {
  const map: Record<TenantStatus, string> = {
    TRIAL: "Trial",
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
    EXPIRED: "Expired",
    ARCHIVED: "Archived",
  };
  return map[status];
}

export function parseTenantStatus(value: string): TenantStatus | null {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  const values: TenantStatus[] = [
    "TRIAL",
    "ACTIVE",
    "SUSPENDED",
    "EXPIRED",
    "ARCHIVED",
  ];
  return values.includes(normalized as TenantStatus)
    ? (normalized as TenantStatus)
    : null;
}

export function formatOnboardingStatus(status: OnboardingStatus): string {
  const map: Record<OnboardingStatus, string> = {
    DRAFT: "Draft",
    SETUP_PENDING: "Setup Pending",
    ACTIVE: "Live",
    BLOCKED: "Blocked",
  };
  return map[status];
}

export function parseOnboardingStatus(value: string): OnboardingStatus | null {
  const map: Record<string, OnboardingStatus> = {
    draft: "DRAFT",
    "setup pending": "SETUP_PENDING",
    provisioning: "SETUP_PENDING",
    ready: "SETUP_PENDING",
    live: "ACTIVE",
    active: "ACTIVE",
    blocked: "BLOCKED",
  };
  return map[value.trim().toLowerCase()] ?? null;
}

export function formatTenantType(type: TenantType): string {
  const map: Record<TenantType, string> = {
    DIAGNOSTIC: "Diagnostic Center",
    HOSPITAL: "Hospital",
    CLINIC: "Clinic Network",
    PHARMACY: "Pharmacy",
    MIXED: "Multi-Specialty",
  };
  return map[type];
}

export function parseTenantType(value: string): TenantType | null {
  const map: Record<string, TenantType> = {
    hospital: "HOSPITAL",
    "diagnostic center": "DIAGNOSTIC",
    diagnostic: "DIAGNOSTIC",
    "clinic network": "CLINIC",
    clinic: "CLINIC",
    pharmacy: "PHARMACY",
    "multi-specialty": "MIXED",
    mixed: "MIXED",
  };
  return map[value.trim().toLowerCase()] ?? null;
}

export function formatBillingCycle(cycle: BillingCycle): string {
  const map: Record<BillingCycle, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    YEARLY: "Yearly",
  };
  return map[cycle];
}

export function parseBillingCycle(value: string): BillingCycle | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === "MONTHLY" || normalized === "QUARTERLY" || normalized === "YEARLY") {
    return normalized;
  }
  return null;
}

export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  const map: Record<SubscriptionStatus, string> = {
    TRIAL: "Trial",
    ACTIVE: "Active",
    DUE: "Due",
    GRACE_PERIOD: "Grace Period",
    SUSPENDED: "Suspended",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
  };
  return map[status];
}

export function formatModuleStatus(status: ModuleStatus): string {
  const map: Record<ModuleStatus, string> = {
    ACTIVE: "Active",
    DISABLED: "Disabled",
    TRIAL: "Trial",
    EXPIRED: "Expired",
  };
  return map[status];
}

export function formatBranchStatus(status: EntityStatus): string {
  return status === "ACTIVE" ? "Active" : status === "INACTIVE" ? "Inactive" : "Archived";
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatBdt(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}
