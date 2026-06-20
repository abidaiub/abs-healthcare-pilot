/**
 * Approved module documentation registry — Diagnostic-First MVP.
 */

export type ModuleDefinition = {
  id: string;
  name: string;
  docPath: string;
  mockupPath?: string;
};

export const MODULES = {
  masterServiceCatalog: {
    id: "10",
    name: "Master Service Catalog",
    docPath: "docs/10-MasterServiceCatalog/MasterServiceCatalog_v1.md",
  },
  patientRegistration: {
    id: "15",
    name: "Patient Registration & MPI",
    docPath: "docs/15-PatientRegistration/PatientRegistration_v1.md",
    mockupPath: "docs/15-PatientRegistration/Mockups/WireframeMockup.md",
  },
  sampleCollection: {
    id: "21",
    name: "Sample Collection & Laboratory Workflow",
    docPath:
      "docs/21-SampleCollectionLaboratoryWorkflow/SampleCollectionLaboratoryWorkflow_v1.md",
    mockupPath:
      "docs/21-SampleCollectionLaboratoryWorkflow/Mockups/WireframeMockup.md",
  },
  resultEntry: {
    id: "22",
    name: "Result Entry & Analyzer Integration",
    docPath:
      "docs/22-ResultEntryAnalyzerIntegration/ResultEntryAnalyzerIntegration_v1.md",
    mockupPath:
      "docs/22-ResultEntryAnalyzerIntegration/Mockups/WireframeMockup.md",
  },
  resultVerification: {
    id: "23",
    name: "Result Verification & Approval",
    docPath: "docs/23-ResultVerificationApproval/ResultVerificationApproval_v1.md",
    mockupPath: "docs/23-ResultVerificationApproval/Mockups/WireframeMockup.md",
  },
  reportRelease: {
    id: "24",
    name: "Report Release & Delivery",
    docPath: "docs/24-ReportReleaseDelivery/ReportReleaseDelivery_v1.md",
    mockupPath: "docs/24-ReportReleaseDelivery/Mockups/WireframeMockup.md",
  },
  patientPortal: {
    id: "30",
    name: "Patient Portal & Self Service",
    docPath: "docs/30-PatientPortalSelfService/PatientPortalSelfService_v1.md",
    mockupPath: "docs/30-PatientPortalSelfService/Mockups/WireframeMockup.md",
  },
  aiPrescription: {
    id: "40",
    name: "AI Prescription Capture & Smart Investigation Billing",
    docPath:
      "docs/40-AIPrescriptionCaptureSmartInvestigationBilling/AIPrescriptionCaptureSmartInvestigationBilling_v1.md",
  },
  platformAdministration: {
    id: "01",
    name: "Platform Administration",
    docPath: "docs/01-CompanyTenant/CompanyTenant_v1.md",
  },
  userManagement: {
    id: "02",
    name: "User Management & RBAC",
    docPath: "docs/02-UserManagement/UserManagement_v1.md",
  },
  auditCenter: {
    id: "04",
    name: "Audit Center",
    docPath: "docs/04-AuditCenter/AuditCenter_v1.md",
  },
} as const satisfies Record<string, ModuleDefinition>;

export type ScreenDefinition = {
  route: string;
  moduleKey: keyof typeof MODULES;
  screenName: string;
  workflowRef?: string;
};

export const SCREENS = {
  tenantLogin: {
    route: "/login",
    moduleKey: "platformAdministration",
    screenName: "Tenant Staff Login",
    workflowRef: "Tenant → Branch → Username → Password",
  },
  hostLogin: {
    route: "/host/login",
    moduleKey: "platformAdministration",
    screenName: "Host Admin Login",
    workflowRef: "Platform administrator sign-in",
  },
  hostDashboard: {
    route: "/host/dashboard",
    moduleKey: "platformAdministration",
    screenName: "Host SaaS Dashboard",
    workflowRef: "Platform KPIs, quick actions, tenant health",
  },
  tenantManagement: {
    route: "/host/tenants",
    moduleKey: "platformAdministration",
    screenName: "Tenant Management",
    workflowRef: "Provision tenants, branches, and subscriptions",
  },
  tenantCreate: {
    route: "/host/tenants/new",
    moduleKey: "platformAdministration",
    screenName: "Create Tenant",
    workflowRef: "Profile → Branding → Deployment → Admin → Package",
  },
  tenantDetail: {
    route: "/host/tenants/[tenantId]",
    moduleKey: "platformAdministration",
    screenName: "Tenant Detail",
    workflowRef: "Subscription, modules, usage limits, status history",
  },
  tenantEdit: {
    route: "/host/tenants/[tenantId]/edit",
    moduleKey: "platformAdministration",
    screenName: "Edit Tenant",
    workflowRef: "Update tenant profile and package",
  },
  branchManagement: {
    route: "/host/tenants/[tenantId]/branches",
    moduleKey: "platformAdministration",
    screenName: "Branch Management",
    workflowRef: "Configure tenant branches",
  },
  subscriptionPackages: {
    route: "/host/subscription-packages",
    moduleKey: "platformAdministration",
    screenName: "Subscription Package Master",
    workflowRef: "Package fees, feature flags, included limits",
  },
  globalModuleRegistry: {
    route: "/host/modules",
    moduleKey: "platformAdministration",
    screenName: "Module Registry",
    workflowRef: "Enable modules and assign to tenants",
  },
  hostAuditLog: {
    route: "/host/audit",
    moduleKey: "auditCenter",
    screenName: "Host Audit Log",
    workflowRef: "Who did what, when, and from where",
  },
  saasSettings: {
    route: "/host/settings",
    moduleKey: "platformAdministration",
    screenName: "SaaS Settings",
    workflowRef: "Platform branding, billing, and security",
  },
  hostTestCatalog: {
    route: "/host/catalog",
    moduleKey: "masterServiceCatalog",
    screenName: "Host Master Service/Test Catalog",
    workflowRef: "Define Service → Assign Dept/Category → Activate",
  },
  tenantTestSetup: {
    route: "/tenant/test-setup",
    moduleKey: "masterServiceCatalog",
    screenName: "Tenant-wise Service/Test Setup",
    workflowRef: "Import Host Master → Configure Price/TAT → Branch Availability",
  },
  serviceCatalogImport: {
    route: "/settings/service-catalog",
    moduleKey: "masterServiceCatalog",
    screenName: "Service Catalog Import",
    workflowRef: "Browse host catalog → Import preview → Import to tenant",
  },
  importedServices: {
    route: "/settings/services",
    moduleKey: "masterServiceCatalog",
    screenName: "Imported Services",
    workflowRef: "Configure price, method, analyzer, reporting, branches",
  },
  testParameters: {
    route: "/settings/test-parameters",
    moduleKey: "resultEntry",
    screenName: "Test Parameters",
    workflowRef: "Units, reference ranges, critical limits",
  },
  sampleTypes: {
    route: "/settings/sample-types",
    moduleKey: "sampleCollection",
    screenName: "Sample Types",
    workflowRef: "Blood, urine, stool, serum, and swab types",
  },
  containers: {
    route: "/settings/containers",
    moduleKey: "sampleCollection",
    screenName: "Containers & Tubes",
    workflowRef: "Tube colors and barcode rules",
  },
  testMethods: {
    route: "/settings/test-methods",
    moduleKey: "resultEntry",
    screenName: "Test Methods",
    workflowRef: "Manual, automated, ELISA, CLIA, microscopy",
  },
  reportingMethods: {
    route: "/settings/reporting-methods",
    moduleKey: "resultEntry",
    screenName: "Reporting Methods",
    workflowRef: "Manual, analyzer, formula, template, narrative",
  },
  analyzers: {
    route: "/settings/analyzers",
    moduleKey: "resultEntry",
    screenName: "Analyzer Management",
    workflowRef: "LIS mapping, HL7/ASTM/CSV interfaces",
  },
  diagnosticDoctors: {
    route: "/settings/doctors",
    moduleKey: "resultVerification",
    screenName: "Doctor Management",
    workflowRef: "Reporting, verifying, and consultant doctors",
  },
  reportDoctorAssignment: {
    route: "/settings/report-doctors",
    moduleKey: "reportRelease",
    screenName: "Report Doctor Assignment",
    workflowRef: "Assign doctors per service",
  },
  signatureTemplates: {
    route: "/settings/signatures",
    moduleKey: "reportRelease",
    screenName: "Signature Templates",
    workflowRef: "Signature, seal, degree, BMDC, QR",
  },
  reportLayouts: {
    route: "/settings/report-layouts",
    moduleKey: "reportRelease",
    screenName: "Report Layouts",
    workflowRef: "Lab, radiology, cardiology report templates",
  },
  printProfiles: {
    route: "/settings/print-profiles",
    moduleKey: "reportRelease",
    screenName: "Print Profiles",
    workflowRef: "A4, A5, legal, thermal margins",
  },
  billingLayouts: {
    route: "/settings/billing-layouts",
    moduleKey: "masterServiceCatalog",
    screenName: "Billing Print Layout",
    workflowRef: "Cash memo, receipt, invoice templates",
  },
  resultDisplayRules: {
    route: "/settings/result-display",
    moduleKey: "resultEntry",
    screenName: "Result Display Rules",
    workflowRef: "Normal, high, low, critical styling",
  },
  receptionDashboard: {
    route: "/dashboard",
    moduleKey: "sampleCollection",
    screenName: "Diagnostic Dashboard",
    workflowRef:
      "Billing → Sample Collection → LIS → Result Entry → Verification → Report Release → Portal",
  },
  patientSearch: {
    route: "/patients",
    moduleKey: "patientRegistration",
    screenName: "Search",
    workflowRef: "Search First → Register or Profile",
  },
  patientRegistration: {
    route: "/patients/new",
    moduleKey: "patientRegistration",
    screenName: "New Registration",
    workflowRef: "Demographics → Identity → Assign MRN",
  },
  appointmentBooking: {
    route: "/appointments",
    moduleKey: "patientRegistration",
    screenName: "Appointment Booking",
    workflowRef: "Search Patient → Select Slot → Confirm",
  },
  doctorWorklist: {
    route: "/doctor/worklist",
    moduleKey: "aiPrescription",
    screenName: "Doctor Worklist",
    workflowRef: "Queue → Consult → Prescribe / Order",
  },
  diagnosticBilling: {
    route: "/diagnostic/billing",
    moduleKey: "masterServiceCatalog",
    screenName: "Diagnostic Billing / Test Order",
    workflowRef: "Patient → Add Tests → Bill → Send to Sample Collection",
  },
  sampleCollection: {
    route: "/lab/sample-collection",
    moduleKey: "sampleCollection",
    screenName: "Sample Collection Queue",
    workflowRef: "Ordered → Pending Collection → Collected",
  },
  labelPrint: {
    route: "/lab/label-print",
    moduleKey: "sampleCollection",
    screenName: "Barcode / Tube Label Print",
    workflowRef: "Generate Barcode → Print Label → Collect Sample",
  },
  lisWorklist: {
    route: "/lab/lis-worklist",
    moduleKey: "resultEntry",
    screenName: "LIS Worklist / Analyzer Interface Queue",
    workflowRef: "Pending Send → Sent → Result Received",
  },
  manualResultEntry: {
    route: "/lab/result-entry",
    moduleKey: "resultEntry",
    screenName: "Manual Result Entry",
    workflowRef: "Draft → Entered → Submit for Verification",
  },
  verification: {
    route: "/lab/verification",
    moduleKey: "resultVerification",
    screenName: "Result Verification / Approval",
    workflowRef: "Verification Pending → Approved → Release Ready",
  },
  reportRelease: {
    route: "/lab/report-release",
    moduleKey: "reportRelease",
    screenName: "Report Generate / Print",
    workflowRef: "Preview → Print/PDF → Release to Portal",
  },
  portalReports: {
    route: "/portal/reports",
    moduleKey: "patientPortal",
    screenName: "My Reports",
    workflowRef: "Login → View → Download / Print / QR Verify",
  },
} as const satisfies Record<string, ScreenDefinition>;

export function getModuleBreadcrumb(
  screenKey: keyof typeof SCREENS,
): string {
  const screen = SCREENS[screenKey];
  if (!screen) {
    return "ABSHealthcareLite";
  }

  const moduleDef = MODULES[screen.moduleKey];
  return `${moduleDef.name} > ${screen.screenName}`;
}
