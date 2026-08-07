import { TENANT_PERMISSION_RESOURCES } from "@/lib/rbac/permission-catalog";
import { canAccess } from "@/lib/rbac/permissions";
import type { EffectivePermission } from "@/lib/rbac/types";
import type { SessionContext } from "@/lib/session";
import { isHostSession } from "@/lib/session";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: string;
};

export type NavGroup = {
  titleKey: string;
  items: NavItem[];
};

export const TENANT_PRIMARY_ROLES = [
  "Tenant Admin",
  "Reception",
  "Billing",
  "Lab Technician",
  "Doctor",
  "Report Delivery",
  "Patient Portal",
] as const;

const HOST_NAV: NavGroup[] = [
  {
    titleKey: "groups.hostConsole",
    items: [
      { href: "/host/dashboard", labelKey: "hostDashboard", icon: "◉" },
      { href: "/host/tenants", labelKey: "tenantManagement", icon: "◇" },
      { href: "/host/subscription-packages", labelKey: "subscriptionPackages", icon: "◆" },
      { href: "/host/modules", labelKey: "moduleRegistry", icon: "▦" },
      { href: "/host/audit", labelKey: "hostAuditLog", icon: "◎" },
      { href: "/host/catalog", labelKey: "hostTestCatalog", icon: "◈" },
      { href: "/host/settings", labelKey: "saasSettings", icon: "⚙" },
    ],
  },
];

/**
 * Single tenant sidebar catalog. Visibility is controlled only by effective VIEW
 * permissions — never by role name / role code allowlists.
 */
export const TENANT_NAV_CATALOG: NavGroup[] = [
  {
    titleKey: "groups.securityIam",
    items: [
      { href: "/settings/readiness", labelKey: "operationalReadiness", icon: "✓" },
      { href: "/settings/users", labelKey: "userManagement", icon: "◌" },
      { href: "/settings/branches", labelKey: "branchManagement", icon: "⌂" },
      { href: "/settings/roles", labelKey: "rolesPermissions", icon: "◍" },
      { href: "/settings/audit", labelKey: "auditCenter", icon: "◎" },
    ],
  },
  {
    titleKey: "groups.diagnosticSetup",
    items: [
      { href: "/settings/service-catalog", labelKey: "serviceCatalog", icon: "◈" },
      { href: "/settings/services", labelKey: "importedServices", icon: "◎" },
      { href: "/settings/test-parameters", labelKey: "testParameters", icon: "⬡" },
      { href: "/settings/sample-types", labelKey: "sampleTypes", icon: "⬢" },
      { href: "/settings/containers", labelKey: "containersTubes", icon: "▤" },
      { href: "/settings/analyzers", labelKey: "analyzers", icon: "⇄" },
      { href: "/settings/doctors", labelKey: "doctors", icon: "✚" },
      { href: "/settings/referral-sources", labelKey: "referralSources", icon: "◇" },
      { href: "/settings/doctor-schedules", labelKey: "doctorSchedules", icon: "🕘" },
      { href: "/settings/patient-portal", labelKey: "patientPortalAdmin", icon: "☰" },
      { href: "/settings/report-layouts", labelKey: "reportLayouts", icon: "⎙" },
    ],
  },
  {
    titleKey: "groups.reception",
    items: [
      { href: "/patients/new", labelKey: "patientRegistration", icon: "＋" },
      { href: "/patients", labelKey: "patientSearch", icon: "⌕" },
      { href: "/appointments/new", labelKey: "appointmentBooking", icon: "📅" },
      { href: "/appointments", labelKey: "appointmentList", icon: "☰" },
      { href: "/appointments/queue", labelKey: "queueDashboard", icon: "⏱" },
      { href: "/consultations", labelKey: "consultationList", icon: "☰" },
      { href: "/prescriptions", labelKey: "prescriptionList", icon: "Rx" },
    ],
  },
  {
    titleKey: "groups.doctor",
    items: [{ href: "/doctor/worklist", labelKey: "doctorWorklist", icon: "✚" }],
  },
  {
    titleKey: "groups.billing",
    items: [
      { href: "/diagnostic/billing", labelKey: "diagnosticBilling", icon: "₤" },
      { href: "/diagnostic/billing/walk-in", labelKey: "walkInDirectBilling", icon: "⚡" },
    ],
  },
  {
    titleKey: "groups.laboratory",
    items: [
      { href: "/lab/orders", labelKey: "labOrders", icon: "☰" },
      { href: "/lab/collection", labelKey: "sampleCollection", icon: "⬢" },
      { href: "/lab/receipt", labelKey: "labReceipt", icon: "↩" },
      { href: "/lab/processing", labelKey: "labProcessing", icon: "⚙" },
      { href: "/lab/label-print", labelKey: "labelPrint", icon: "▤" },
      { href: "/lab/lis-worklist", labelKey: "lisWorklist", icon: "⇄" },
      { href: "/lab/result-entry", labelKey: "manualResultEntry", icon: "✎" },
      { href: "/lab/verification", labelKey: "verification", icon: "✓" },
      { href: "/lab/corrections", labelKey: "corrections", icon: "↺" },
      { href: "/lab/report-release", labelKey: "reportRelease", icon: "⎙" },
    ],
  },
  {
    titleKey: "groups.pharmacy",
    items: [
      { href: "/pharmacy/medications", labelKey: "medicationCatalog", icon: "💊" },
      { href: "/pharmacy/generics", labelKey: "genericMaster", icon: "◈" },
      { href: "/pharmacy/manufacturers", labelKey: "manufacturerMaster", icon: "◇" },
      { href: "/pharmacy/reference-data", labelKey: "medicationReferenceData", icon: "▦" },
      { href: "/pharmacy/branch-availability", labelKey: "branchMedicationAvailability", icon: "⌂" },
      { href: "/pharmacy/import", labelKey: "medicationImport", icon: "⬇" },
    ],
  },
  {
    titleKey: "groups.patientPortal",
    items: [{ href: "/portal/reports", labelKey: "myReports", icon: "☰" }],
  },
];

function normalizeRoute(route: string): string {
  return route.split("?")[0]?.replace(/\/$/, "") || "/";
}

/** Exact registry match for a nav href (resourceKey or route). */
export function resolveNavResourceKey(href: string): string | null {
  const normalized = normalizeRoute(href);
  const exact = TENANT_PERMISSION_RESOURCES.find(
    (resource) =>
      resource.resourceKey === normalized || resource.route === normalized,
  );
  return exact?.resourceKey ?? null;
}

export function canViewNavHref(
  permissions: Map<string, EffectivePermission>,
  href: string,
): boolean {
  const resourceKey = resolveNavResourceKey(href);
  if (!resourceKey) return false;
  return canAccess(permissions, resourceKey, "canView");
}

/**
 * Shared permission-aware navigation filter.
 * - Leaf visible only with effective VIEW on its registry resource
 * - Parent visible when at least one child is visible
 * - Empty parents are removed
 */
export function filterNavGroupsByViewAccess(
  groups: NavGroup[],
  permissions: Map<string, EffectivePermission>,
): NavGroup[] {
  return groups
    .map((group) => ({
      titleKey: group.titleKey,
      items: group.items.filter((item) => canViewNavHref(permissions, item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

export function getTenantNavGroupsFromPermissions(
  permissions: Map<string, EffectivePermission>,
): NavGroup[] {
  return filterNavGroupsByViewAccess(TENANT_NAV_CATALOG, permissions);
}

export function getHostNavGroups(): NavGroup[] {
  return HOST_NAV;
}

/** Host nav only. Tenant nav must be resolved with effective permissions. */
export function getNavGroups(session: SessionContext): NavGroup[] {
  if (isHostSession(session)) {
    return getHostNavGroups();
  }
  return [];
}

/** @deprecated Use resolveAuthorizedNavGroups / getTenantNavGroupsFromPermissions */
export function getDiagnosticNavGroups(session: SessionContext): NavGroup[] {
  return getNavGroups(session);
}

export function getRoleHomePath(role: string, roleCode?: string): string {
  if (role === "Host Admin" || roleCode === "HOST_ADMIN") return "/host/dashboard";

  if (
    roleCode === "TENANT_ADMIN" ||
    role === "Tenant Admin" ||
    role === "Company Admin" ||
    role === "Primary Tenant Admin"
  ) {
    return "/settings/users";
  }

  if (
    roleCode === "RECEPTION" ||
    role === "Reception" ||
    role === "Receptionist" ||
    role === "Cashier"
  ) {
    return "/dashboard";
  }

  if (roleCode === "DOCTOR" || role === "Doctor") {
    return "/doctor/worklist";
  }

  if (
    roleCode === "LAB_TECH" ||
    role === "Lab Technician" ||
    role === "Lab Supervisor" ||
    role === "Pathologist"
  ) {
    return "/lab/sample-collection";
  }

  if (
    roleCode === "BILLING" ||
    roleCode === "DP_BILLING" ||
    role === "Billing" ||
    role === "Billing User"
  ) {
    return "/diagnostic/billing";
  }

  if (role === "Report Delivery") return "/lab/report-release";

  if (role === "Patient Portal" || role === "Patient Portal User") {
    return "/portal/reports";
  }

  return "/dashboard";
}

/** Flat unique nav hrefs from the tenant catalog (for consistency tests). */
export function listTenantNavHrefs(): string[] {
  const hrefs = new Set<string>();
  for (const group of TENANT_NAV_CATALOG) {
    for (const item of group.items) {
      hrefs.add(normalizeRoute(item.href));
    }
  }
  return [...hrefs].sort();
}
