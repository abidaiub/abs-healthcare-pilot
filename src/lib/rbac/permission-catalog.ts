export type PermissionAction =
  | "canView"
  | "canCreate"
  | "canEdit"
  | "canDelete"
  | "canApprove"
  | "canPrint";

export type PermissionResource = {
  resourceKey: string;
  moduleCode: string;
  permissionCode: string;
  label: string;
  route: string;
  group: string;
};

export const PERMISSION_ACTIONS: Array<{
  key: PermissionAction;
  label: string;
}> = [
  { key: "canView", label: "View" },
  { key: "canCreate", label: "Create" },
  { key: "canEdit", label: "Edit" },
  { key: "canDelete", label: "Delete" },
  { key: "canApprove", label: "Approve" },
  { key: "canPrint", label: "Print" },
];

export const TENANT_PERMISSION_RESOURCES: PermissionResource[] = [
  {
    resourceKey: "/settings/users",
    moduleCode: "MOD-02",
    permissionCode: "USER_MGMT",
    label: "User Management",
    route: "/settings/users",
    group: "Security & IAM",
  },
  {
    resourceKey: "/settings/roles",
    moduleCode: "MOD-03",
    permissionCode: "ROLE_MGMT",
    label: "Roles & Permissions",
    route: "/settings/roles",
    group: "Security & IAM",
  },
  {
    resourceKey: "/settings/audit",
    moduleCode: "MOD-04",
    permissionCode: "AUDIT_CENTER",
    label: "Audit Center",
    route: "/settings/audit",
    group: "Security & IAM",
  },
  {
    resourceKey: "/settings/branches",
    moduleCode: "MOD-07",
    permissionCode: "BRANCH_MGMT",
    label: "Branch Management",
    route: "/settings/branches",
    group: "Security & IAM",
  },
  {
    resourceKey: "/settings/service-catalog",
    moduleCode: "MOD-10",
    permissionCode: "SERVICE_CATALOG",
    label: "Service Catalog Import",
    route: "/settings/service-catalog",
    group: "Diagnostic Setup",
  },
  {
    resourceKey: "/settings/services",
    moduleCode: "MOD-10",
    permissionCode: "IMPORTED_SERVICES",
    label: "Imported Services",
    route: "/settings/services",
    group: "Diagnostic Setup",
  },
  {
    resourceKey: "/settings/test-parameters",
    moduleCode: "MOD-22",
    permissionCode: "TEST_PARAMETERS",
    label: "Test Parameters",
    route: "/settings/test-parameters",
    group: "Diagnostic Setup",
  },
  {
    resourceKey: "/settings/sample-types",
    moduleCode: "MOD-21",
    permissionCode: "SAMPLE_TYPES",
    label: "Sample Types",
    route: "/settings/sample-types",
    group: "Diagnostic Setup",
  },
  {
    resourceKey: "/settings/containers",
    moduleCode: "MOD-21",
    permissionCode: "CONTAINERS",
    label: "Containers & Tubes",
    route: "/settings/containers",
    group: "Diagnostic Setup",
  },
  {
    resourceKey: "/settings/analyzers",
    moduleCode: "MOD-22",
    permissionCode: "ANALYZERS",
    label: "Analyzers",
    route: "/settings/analyzers",
    group: "Diagnostic Setup",
  },
  {
    resourceKey: "/settings/doctors",
    moduleCode: "MOD-11",
    permissionCode: "DOCTORS",
    label: "Doctors",
    route: "/settings/doctors",
    group: "Diagnostic Setup",
  },
  {
    resourceKey: "/settings/report-layouts",
    moduleCode: "MOD-24",
    permissionCode: "REPORT_LAYOUTS",
    label: "Report Layouts",
    route: "/settings/report-layouts",
    group: "Diagnostic Setup",
  },
  {
    resourceKey: "/dashboard",
    moduleCode: "MOD-15",
    permissionCode: "DASHBOARD",
    label: "Diagnostic Dashboard",
    route: "/dashboard",
    group: "Operations",
  },
  {
    resourceKey: "/patients",
    moduleCode: "MOD-15",
    permissionCode: "PATIENT_SEARCH",
    label: "Patient Search",
    route: "/patients",
    group: "Operations",
  },
  {
    resourceKey: "/patients/new",
    moduleCode: "MOD-15",
    permissionCode: "PATIENT_REGISTER",
    label: "Patient Registration",
    route: "/patients/new",
    group: "Operations",
  },
  {
    resourceKey: "/diagnostic/billing",
    moduleCode: "MOD-10",
    permissionCode: "DIAG_BILLING",
    label: "Diagnostic Billing",
    route: "/diagnostic/billing",
    group: "Operations",
  },
  {
    resourceKey: "/lab/sample-collection",
    moduleCode: "MOD-21",
    permissionCode: "SAMPLE_COLLECTION",
    label: "Sample Collection",
    route: "/lab/sample-collection",
    group: "Laboratory",
  },
  {
    resourceKey: "/lab/label-print",
    moduleCode: "MOD-21",
    permissionCode: "LABEL_PRINT",
    label: "Label Print",
    route: "/lab/label-print",
    group: "Laboratory",
  },
  {
    resourceKey: "/lab/lis-worklist",
    moduleCode: "MOD-22",
    permissionCode: "LIS_WORKLIST",
    label: "LIS Worklist",
    route: "/lab/lis-worklist",
    group: "Laboratory",
  },
  {
    resourceKey: "/lab/result-entry",
    moduleCode: "MOD-22",
    permissionCode: "RESULT_ENTRY",
    label: "Manual Result Entry",
    route: "/lab/result-entry",
    group: "Laboratory",
  },
  {
    resourceKey: "/lab/verification",
    moduleCode: "MOD-23",
    permissionCode: "VERIFICATION",
    label: "Result Verification",
    route: "/lab/verification",
    group: "Laboratory",
  },
  {
    resourceKey: "/lab/report-release",
    moduleCode: "MOD-24",
    permissionCode: "REPORT_RELEASE",
    label: "Report Release",
    route: "/lab/report-release",
    group: "Laboratory",
  },
  {
    resourceKey: "/portal/reports",
    moduleCode: "MOD-30",
    permissionCode: "PORTAL_REPORTS",
    label: "Patient Portal Reports",
    route: "/portal/reports",
    group: "Portal",
  },
];

export function getResourceByRoute(route: string): PermissionResource | undefined {
  const normalized = route.split("?")[0]?.replace(/\/$/, "") || "/";
  return TENANT_PERMISSION_RESOURCES.find(
    (resource) =>
      resource.route === normalized ||
      normalized.startsWith(`${resource.route}/`),
  );
}

export function getResourceGroups(): string[] {
  return [...new Set(TENANT_PERMISSION_RESOURCES.map((resource) => resource.group))];
}
