import { createHash } from "node:crypto";
import type { PermissionAction } from "@/lib/rbac/permission-catalog";

export const TENANT_ADMIN_ROLE_CODES = ["TENANT_ADMIN", "DP_TENANT_ADMIN"] as const;

export type TenantAdminAccessGrantId =
  | "users.view"
  | "users.create"
  | "users.manage"
  | "roles.view"
  | "branches.view"
  | "branches.create"
  | "branches.manage"
  | "readiness.view"
  | "readiness.manageUsers"
  | "readiness.configure"
  | "readiness.declare"
  | "doctors.view"
  | "doctors.create"
  | "doctors.manage"
  | "schedules.view"
  | "schedules.create"
  | "schedules.manage"
  | "catalog.view"
  | "catalog.manage"
  | "services.view"
  | "services.manage"
  | "analyzers.view"
  | "analyzers.create"
  | "analyzers.manage"
  | "sampleTypes.view"
  | "sampleTypes.manage"
  | "containers.view"
  | "containers.manage"
  | "testParameters.view"
  | "testParameters.manage"
  | "portal.view"
  | "portal.manage"
  | "dashboard.view"
  | "audit.view";

export type TenantAdminAccessGrant = {
  id: TenantAdminAccessGrantId;
  group:
    | "User Management"
    | "Branch & Lookups"
    | "Go-Live Wizard"
    | "Clinical Setup"
    | "Diagnostic Catalog"
    | "Audit Access";
  label: string;
  description: string;
  resourceKey: string;
  action: PermissionAction;
};

export const TENANT_ADMIN_ACCESS_GRANTS: readonly TenantAdminAccessGrant[] = [
  {
    id: "users.view",
    group: "User Management",
    label: "View tenant users",
    description: "Open the tenant-scoped user list and user details.",
    resourceKey: "/settings/users",
    action: "canView",
  },
  {
    id: "users.create",
    group: "User Management",
    label: "Create tenant users",
    description: "Create users inside this tenant with an allowed role, branch, and department.",
    resourceKey: "/settings/users",
    action: "canCreate",
  },
  {
    id: "users.manage",
    group: "User Management",
    label: "Edit and manage tenant users",
    description: "Edit identity and assignments, activate/deactivate, reset passwords, and force password change.",
    resourceKey: "/settings/users",
    action: "canEdit",
  },
  {
    id: "roles.view",
    group: "Branch & Lookups",
    label: "View tenant roles",
    description: "View roles for assignment; role creation and permission editing remain blocked.",
    resourceKey: "/settings/roles",
    action: "canView",
  },
  {
    id: "branches.view",
    group: "Branch & Lookups",
    label: "View tenant branches",
    description: "View branch choices owned by this tenant.",
    resourceKey: "/settings/branches",
    action: "canView",
  },
  {
    id: "branches.create",
    group: "Branch & Lookups",
    label: "Create branches",
    description: "Create operating branches for this tenant.",
    resourceKey: "/settings/branches",
    action: "canCreate",
  },
  {
    id: "branches.manage",
    group: "Branch & Lookups",
    label: "Edit branches",
    description: "Update branch profile and status for this tenant.",
    resourceKey: "/settings/branches",
    action: "canEdit",
  },
  {
    id: "readiness.view",
    group: "Go-Live Wizard",
    label: "View operational readiness",
    description: "Open the Tenant Go-Live / Operational Readiness wizard pages.",
    resourceKey: "/settings/readiness",
    action: "canView",
  },
  {
    id: "readiness.manageUsers",
    group: "Go-Live Wizard",
    label: "Create users from readiness wizard",
    description: "Create operational users and suggested departments from MOD-00.",
    resourceKey: "/settings/readiness",
    action: "canCreate",
  },
  {
    id: "readiness.configure",
    group: "Go-Live Wizard",
    label: "Configure go-live settings",
    description: "Save company profile, portal, LIS, and other readiness configuration.",
    resourceKey: "/settings/readiness",
    action: "canEdit",
  },
  {
    id: "readiness.declare",
    group: "Go-Live Wizard",
    label: "Declare ready for first patient",
    description: "Approve the READY FOR FIRST PATIENT go-live gate when checklist passes.",
    resourceKey: "/settings/readiness",
    action: "canApprove",
  },
  {
    id: "doctors.view",
    group: "Clinical Setup",
    label: "View doctors",
    description: "Open the doctor master list.",
    resourceKey: "/settings/doctors",
    action: "canView",
  },
  {
    id: "doctors.create",
    group: "Clinical Setup",
    label: "Create doctors",
    description: "Register doctors including verification doctors.",
    resourceKey: "/settings/doctors",
    action: "canCreate",
  },
  {
    id: "doctors.manage",
    group: "Clinical Setup",
    label: "Edit doctors",
    description: "Update doctor profile, department, and verification flags.",
    resourceKey: "/settings/doctors",
    action: "canEdit",
  },
  {
    id: "schedules.view",
    group: "Clinical Setup",
    label: "View doctor schedules",
    description: "Open doctor schedule setup.",
    resourceKey: "/settings/doctor-schedules",
    action: "canView",
  },
  {
    id: "schedules.create",
    group: "Clinical Setup",
    label: "Create doctor schedules",
    description: "Create schedule templates for doctors.",
    resourceKey: "/settings/doctor-schedules",
    action: "canCreate",
  },
  {
    id: "schedules.manage",
    group: "Clinical Setup",
    label: "Publish doctor schedules",
    description: "Edit and publish doctor schedules required for go-live.",
    resourceKey: "/settings/doctor-schedules",
    action: "canEdit",
  },
  {
    id: "catalog.view",
    group: "Diagnostic Catalog",
    label: "View service catalog",
    description: "Browse host/tenant service catalog for go-live.",
    resourceKey: "/settings/service-catalog",
    action: "canView",
  },
  {
    id: "catalog.manage",
    group: "Diagnostic Catalog",
    label: "Manage service catalog",
    description: "Import or maintain catalog entries for the tenant.",
    resourceKey: "/settings/service-catalog",
    action: "canEdit",
  },
  {
    id: "services.view",
    group: "Diagnostic Catalog",
    label: "View imported services",
    description: "View tenant-priced services.",
    resourceKey: "/settings/services",
    action: "canView",
  },
  {
    id: "services.manage",
    group: "Diagnostic Catalog",
    label: "Manage imported services",
    description: "Maintain prices and service readiness fields.",
    resourceKey: "/settings/services",
    action: "canEdit",
  },
  {
    id: "analyzers.view",
    group: "Diagnostic Catalog",
    label: "View analyzers",
    description: "Open analyzer master list.",
    resourceKey: "/settings/analyzers",
    action: "canView",
  },
  {
    id: "analyzers.create",
    group: "Diagnostic Catalog",
    label: "Create analyzers",
    description: "Register analyzers for LIS readiness.",
    resourceKey: "/settings/analyzers",
    action: "canCreate",
  },
  {
    id: "analyzers.manage",
    group: "Diagnostic Catalog",
    label: "Manage analyzers",
    description: "Edit analyzers and mappings used by go-live checks.",
    resourceKey: "/settings/analyzers",
    action: "canEdit",
  },
  {
    id: "sampleTypes.view",
    group: "Diagnostic Catalog",
    label: "View sample types",
    description: "Open sample type setup.",
    resourceKey: "/settings/sample-types",
    action: "canView",
  },
  {
    id: "sampleTypes.manage",
    group: "Diagnostic Catalog",
    label: "Manage sample types",
    description: "Maintain sample types for catalog readiness.",
    resourceKey: "/settings/sample-types",
    action: "canEdit",
  },
  {
    id: "containers.view",
    group: "Diagnostic Catalog",
    label: "View containers & tubes",
    description: "Open container/tube setup.",
    resourceKey: "/settings/containers",
    action: "canView",
  },
  {
    id: "containers.manage",
    group: "Diagnostic Catalog",
    label: "Manage containers & tubes",
    description: "Maintain tubes/containers for catalog readiness.",
    resourceKey: "/settings/containers",
    action: "canEdit",
  },
  {
    id: "testParameters.view",
    group: "Diagnostic Catalog",
    label: "View test parameters",
    description: "Open test parameter and reference-range setup.",
    resourceKey: "/settings/test-parameters",
    action: "canView",
  },
  {
    id: "testParameters.manage",
    group: "Diagnostic Catalog",
    label: "Manage test parameters",
    description: "Maintain parameters and reference ranges for go-live.",
    resourceKey: "/settings/test-parameters",
    action: "canEdit",
  },
  {
    id: "portal.view",
    group: "Go-Live Wizard",
    label: "View patient portal settings",
    description: "Open patient portal administration.",
    resourceKey: "/settings/patient-portal",
    action: "canView",
  },
  {
    id: "portal.manage",
    group: "Go-Live Wizard",
    label: "Manage patient portal settings",
    description: "Configure portal policy for readiness.",
    resourceKey: "/settings/patient-portal",
    action: "canEdit",
  },
  {
    id: "dashboard.view",
    group: "Branch & Lookups",
    label: "View tenant dashboard",
    description: "Open the tenant operations dashboard after login.",
    resourceKey: "/dashboard",
    action: "canView",
  },
  {
    id: "audit.view",
    group: "Audit Access",
    label: "View relevant user audit history",
    description: "Read the tenant audit center; platform audit administration is never granted.",
    resourceKey: "/settings/audit",
    action: "canView",
  },
] as const;

export const RECOMMENDED_TENANT_ADMIN_GRANT_IDS = TENANT_ADMIN_ACCESS_GRANTS.map(
  (grant) => grant.id,
);

export function isTenantAdminRoleCode(roleCode: string): boolean {
  return TENANT_ADMIN_ROLE_CODES.includes(
    roleCode as (typeof TENANT_ADMIN_ROLE_CODES)[number],
  );
}

export function permissionStateToken(
  rows: Array<{
    resourceKey: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canApprove?: boolean;
  }>,
): string {
  const normalized = rows
    .map((row) => ({
      resourceKey: row.resourceKey,
      canView: row.canView,
      canCreate: row.canCreate,
      canEdit: row.canEdit,
      canApprove: Boolean(row.canApprove),
    }))
    .sort((a, b) => a.resourceKey.localeCompare(b.resourceKey));

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
