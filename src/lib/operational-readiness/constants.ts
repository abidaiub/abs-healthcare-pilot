export const MOD00_SOFTWARE_VERSION = "0.1.0";

export const READINESS_RESOURCE = "/settings/readiness";

export type RequiredDepartmentDef = {
  key: string;
  label: string;
  match: RegExp;
};

/** Operating departments required before first patient. */
export const REQUIRED_OPERATING_DEPARTMENTS: RequiredDepartmentDef[] = [
  { key: "reception", label: "Reception", match: /reception/i },
  { key: "billing", label: "Billing", match: /billing/i },
  { key: "collection", label: "Collection", match: /collection|collect/i },
  { key: "haematology", label: "Haematology", match: /haematol|hematol|\bhaem\b/i },
  { key: "biochemistry", label: "Biochemistry", match: /biochem/i },
  { key: "hormone", label: "Hormone", match: /hormone|immunolog/i },
  { key: "electrolyte", label: "Electrolyte", match: /electro/i },
  {
    key: "clinicalPathology",
    label: "Clinical Pathology",
    match: /clinical path|clinpath|urine/i,
  },
  { key: "microbiology", label: "Microbiology", match: /microbiol/i },
  { key: "histopathology", label: "Histopathology", match: /histopath/i },
  { key: "radiology", label: "Radiology", match: /radiol/i },
];

export type RequiredUserRoleDef = {
  key: string;
  label: string;
  match: RegExp;
};

export const REQUIRED_OPERATIONAL_ROLES: RequiredUserRoleDef[] = [
  { key: "tenantAdmin", label: "Tenant Admin", match: /tenant.?admin|admin/i },
  { key: "reception", label: "Reception", match: /reception/i },
  { key: "billing", label: "Billing", match: /billing|cash/i },
  { key: "collection", label: "Collection", match: /collection|phlebotom/i },
  {
    key: "sectionTechnician",
    label: "Section Technician",
    match: /tech|technician|haem|biochem|hormone|electro|clinpath|laboratory/i,
  },
  { key: "reportEntry", label: "Report Entry", match: /report.?entry|result.?entry/i },
  {
    key: "verificationDoctor",
    label: "Verification Doctor",
    match: /verif|patholog/i,
  },
  {
    key: "reportDelivery",
    label: "Report Delivery",
    match: /report.?delivery|delivery/i,
  },
];

export const SUGGESTED_DEPARTMENTS = [
  { deptCode: "RECEPTION", name: "Reception", deptType: "Administrative" },
  { deptCode: "BILLING", name: "Billing", deptType: "Administrative" },
  { deptCode: "COLLECTION", name: "Sample Collection", deptType: "Clinical" },
  { deptCode: "HAEMATOLOGY", name: "Haematology", deptType: "Clinical" },
  { deptCode: "BIOCHEMISTRY", name: "Biochemistry", deptType: "Clinical" },
  { deptCode: "HORMONE", name: "Hormone", deptType: "Clinical" },
  { deptCode: "ELECTROLYTE", name: "Electrolyte", deptType: "Clinical" },
  { deptCode: "CLINPATH", name: "Clinical Pathology", deptType: "Clinical" },
  { deptCode: "MICROBIOLOGY", name: "Microbiology", deptType: "Clinical" },
  { deptCode: "HISTOPATHOLOGY", name: "Histopathology", deptType: "Clinical" },
  { deptCode: "RADIOLOGY", name: "Radiology", deptType: "Clinical" },
] as const;

export const READINESS_WIZARD_STEPS = [
  { key: "dashboard", href: "/settings/readiness", label: "Readiness" },
  { key: "company", href: "/settings/readiness/company", label: "Company" },
  { key: "departments", href: "/settings/readiness/departments", label: "Departments" },
  { key: "users", href: "/settings/readiness/users", label: "Users" },
  { key: "doctors", href: "/settings/readiness/doctors", label: "Doctors" },
  { key: "catalog", href: "/settings/readiness/catalog", label: "Catalog" },
  {
    key: "referenceRanges",
    href: "/settings/readiness/reference-ranges",
    label: "Ranges",
  },
  { key: "analyzers", href: "/settings/readiness/analyzers", label: "Analyzers" },
  { key: "lis", href: "/settings/readiness/lis", label: "LIS" },
  { key: "portal", href: "/settings/readiness/portal", label: "Portal" },
] as const;
