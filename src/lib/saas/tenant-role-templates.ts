import {
  TENANT_PERMISSION_RESOURCES,
  type PermissionAction,
} from "@/lib/rbac/permission-catalog";

export type TenantRoleTemplate = {
  roleCode: string;
  roleName: string;
  description: string;
  fullAccess?: boolean;
  resourceKeys?: string[];
  actions?: PermissionAction[];
  denyActions?: Record<string, PermissionAction[]>;
};

/** Standard tenant-scoped operational roles (excluding Host). */
export const TENANT_ROLE_TEMPLATES: readonly TenantRoleTemplate[] = [
  {
    roleCode: "TENANT_ADMIN",
    roleName: "Primary Tenant Admin",
    description: "Full tenant administration including users, roles, and setup",
    fullAccess: true,
    denyActions: {
      "/lab/report-release/release": ["canApprove"],
      "/lab/report-release/portal-publish": ["canApprove"],
      "/lab/report-release/withdraw": ["canApprove"],
      "/lab/report-release/amend": ["canApprove"],
      "/lab/verification/verify": ["canApprove"],
    },
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
      "/lab/report-release",
      "/lab/report-release/print",
    ],
    actions: ["canView", "canCreate", "canEdit", "canPrint"],
    denyActions: {
      "/lab/report-release": ["canApprove", "canEdit"],
    },
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
      "/lab/orders/confirm",
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
      "/lab/orders/confirm",
      "/lab/collection",
      "/lab/receipt",
      "/lab/processing",
      "/lab/orders/collect",
      "/lab/samples/label",
      "/lab/sample-collection",
      "/lab/label-print",
      "/lab/lis-worklist",
      "/lab/result-entry",
      "/lab/result-entry/edit",
      "/lab/result-entry/complete",
      "/lab/result-entry/reopen",
      "/lab/result-entry/critical-acknowledge",
      "/lab/verification",
      "/lab/corrections",
      "/lab/corrections/resubmit",
      "/lab/report-release",
      "/lab/report-release/prepare",
      "/lab/report-release/print",
      "/lab/report-release/download",
      "/lab/report-release/history",
    ],
    actions: ["canView", "canCreate", "canEdit", "canApprove", "canPrint"],
    denyActions: {
      "/lab/verification": ["canApprove"],
      "/lab/report-release/release": ["canApprove"],
      "/lab/report-release/portal-publish": ["canApprove"],
      "/lab/report-release/withdraw": ["canApprove"],
      "/lab/report-release/amend": ["canApprove"],
    },
  },
  {
    roleCode: "PATHOLOGIST",
    roleName: "Pathologist",
    description: "Laboratory result verification and approval",
    resourceKeys: [
      "/lab/verification",
      "/lab/verification/review",
      "/lab/verification/verify",
      "/lab/verification/reject",
      "/lab/verification/history",
      "/lab/result-entry",
    ],
    actions: ["canView", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "LAB_SUPERVISOR",
    roleName: "Lab Supervisor",
    description: "Laboratory supervision including report release governance",
    resourceKeys: [
      "/lab/report-release",
      "/lab/report-release/prepare",
      "/lab/report-release/release",
      "/lab/report-release/print",
      "/lab/report-release/download",
      "/lab/report-release/reprint",
      "/lab/report-release/portal-publish",
      "/lab/report-release/withdraw",
      "/lab/report-release/amend",
      "/lab/report-release/billing-hold",
      "/lab/report-release/quality-hold",
      "/lab/report-release/history",
      "/lab/verification",
      "/lab/verification/history",
    ],
    actions: ["canView", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "REPORT_OFFICER",
    roleName: "Report Release Officer",
    description: "Diagnostic report release, print, and delivery",
    resourceKeys: [
      "/lab/report-release",
      "/lab/report-release/prepare",
      "/lab/report-release/release",
      "/lab/report-release/print",
      "/lab/report-release/download",
      "/lab/report-release/reprint",
      "/lab/report-release/portal-publish",
      "/lab/report-release/history",
    ],
    actions: ["canView", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "BILLING",
    roleName: "Billing",
    description: "Diagnostic billing, test orders, and patient registration",
    resourceKeys: [
      "/dashboard",
      "/patients",
      "/patients/new",
      "/diagnostic/billing",
    ],
    actions: ["canView", "canCreate", "canEdit", "canPrint"],
  },
] as const;

export const OPERATIONAL_ROLE_TEMPLATES = TENANT_ROLE_TEMPLATES.filter(
  (template) => template.roleCode !== "TENANT_ADMIN",
);

export const TENANT_ADMIN_CLINICAL_SOD_DENIES = [
  "/lab/verification/verify",
  "/lab/report-release/release",
  "/lab/report-release/portal-publish",
  "/lab/report-release/withdraw",
  "/lab/report-release/amend",
] as const;

export function buildPermissionRowsFromTemplate(
  tenantId: string,
  roleId: string,
  template: TenantRoleTemplate,
  actor: string,
) {
  const actions: PermissionAction[] = template.actions ?? [
    "canView",
    "canCreate",
    "canEdit",
    "canDelete",
    "canApprove",
    "canPrint",
  ];

  const resources = template.fullAccess
    ? TENANT_PERMISSION_RESOURCES
    : TENANT_PERMISSION_RESOURCES.filter((resource) =>
        template.resourceKeys?.includes(resource.resourceKey),
      );

  return resources.map((resource) => ({
    tenantId,
    roleId,
    permissionCode: resource.permissionCode,
    moduleCode: resource.moduleCode,
    resourceKey: resource.resourceKey,
    canView:
      actions.includes("canView") &&
      !(template.denyActions?.[resource.resourceKey]?.includes("canView")),
    canCreate:
      actions.includes("canCreate") &&
      !(template.denyActions?.[resource.resourceKey]?.includes("canCreate")),
    canEdit:
      actions.includes("canEdit") &&
      !(template.denyActions?.[resource.resourceKey]?.includes("canEdit")),
    canDelete:
      actions.includes("canDelete") &&
      !(template.denyActions?.[resource.resourceKey]?.includes("canDelete")),
    canApprove:
      actions.includes("canApprove") &&
      !(template.denyActions?.[resource.resourceKey]?.includes("canApprove")),
    canPrint:
      actions.includes("canPrint") &&
      !(template.denyActions?.[resource.resourceKey]?.includes("canPrint")),
    createdBy: actor,
    updatedBy: actor,
  }));
}
