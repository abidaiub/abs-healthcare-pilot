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
    docPath: "docs/modules/MOD-15-Patient-Registration.md",
    mockupPath: "docs/15-PatientRegistration/Mockups/WireframeMockup.md",
  },
  appointmentQueue: {
    id: "17",
    name: "Appointment & Queue Management",
    docPath: "docs/modules/MOD-17-Appointment-Queue-Management.md",
    mockupPath: "docs/17-AppointmentManagement/Mockups/WireframeMockup.md",
  },
  doctorConsultation: {
    id: "18",
    name: "Doctor Worklist & Clinical Encounter",
    docPath: "docs/modules/MOD-18-Doctor-Consultation.md",
    mockupPath: "docs/18-DoctorWorklistEncounter/Mockups/WireframeMockup.md",
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
  rolePermission: {
    id: "03",
    name: "Role & Permission Management",
    docPath: "docs/03-RolePermission/RolePermission_v1.md",
  },
  auditCenter: {
    id: "04",
    name: "Audit Center",
    docPath: "docs/04-AuditCenter/AuditCenter_v1.md",
  },
  localizationEngine: {
    id: "06",
    name: "Localization Engine",
    docPath: "docs/modules/MOD-06-Localization.md",
  },
  branchLocation: {
    id: "07",
    name: "Branch / Location Management",
    docPath: "docs/modules/MOD-07-Branch-Location-Management.md",
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
  tenantUserList: {
    route: "/settings/users",
    moduleKey: "userManagement",
    screenName: "User List",
    workflowRef: "Search users → Edit profile → Assign role/branch",
  },
  tenantBranchList: {
    route: "/settings/branches",
    moduleKey: "branchLocation",
    screenName: "Branch List",
    workflowRef: "Create, activate, and manage tenant branches",
  },
  tenantBranchDetail: {
    route: "/settings/branches/[branchId]",
    moduleKey: "branchLocation",
    screenName: "Branch Detail",
    workflowRef: "View branch profile, assignments, and defaults",
  },
  tenantUserCreate: {
    route: "/settings/users/new",
    moduleKey: "userManagement",
    screenName: "Create User",
    workflowRef: "Credentials → Primary role → Primary branch",
  },
  tenantUserEdit: {
    route: "/settings/users/[userId]",
    moduleKey: "userManagement",
    screenName: "Edit User",
    workflowRef: "Update profile → Reset password → Status control",
  },
  tenantRoleList: {
    route: "/settings/roles",
    moduleKey: "rolePermission",
    screenName: "Role List",
    workflowRef: "Define roles → Open permission matrix",
  },
  tenantRoleCreate: {
    route: "/settings/roles/new",
    moduleKey: "rolePermission",
    screenName: "Create Role",
    workflowRef: "Role code → Role name → Permission matrix",
  },
  tenantPermissionMatrix: {
    route: "/settings/roles/[roleId]/permissions",
    moduleKey: "rolePermission",
    screenName: "Permission Matrix",
    workflowRef: "View/Create/Edit/Delete/Approve/Print per route",
  },
  tenantAuditCenter: {
    route: "/settings/audit",
    moduleKey: "auditCenter",
    screenName: "Audit Center",
    workflowRef: "Filter → Inspect detail → Export CSV",
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
    workflowRef: "Demographics → Identity → Assign patient number",
  },
  patientDetail: {
    route: "/patients/[patientId]",
    moduleKey: "patientRegistration",
    screenName: "Patient Detail",
    workflowRef: "View demographics, contacts, and registration branch",
  },
  patientEdit: {
    route: "/patients/[patientId]/edit",
    moduleKey: "patientRegistration",
    screenName: "Edit Patient",
    workflowRef: "Update registration data without changing patient number",
  },
  appointmentBooking: {
    route: "/appointments/new",
    moduleKey: "appointmentQueue",
    screenName: "New Appointment",
    workflowRef: "Patient → Doctor → Slot → Book",
  },
  appointmentList: {
    route: "/appointments",
    moduleKey: "appointmentQueue",
    screenName: "Appointment List",
    workflowRef: "Search and manage appointments",
  },
  appointmentDetail: {
    route: "/appointments/[appointmentId]",
    moduleKey: "appointmentQueue",
    screenName: "Appointment Detail",
    workflowRef: "View appointment and queue status",
  },
  appointmentEdit: {
    route: "/appointments/[appointmentId]/edit",
    moduleKey: "appointmentQueue",
    screenName: "Edit Appointment",
    workflowRef: "Update appointment without changing appointment number",
  },
  queueDashboard: {
    route: "/appointments/queue",
    moduleKey: "appointmentQueue",
    screenName: "Queue Dashboard",
    workflowRef: "Branch queue overview by doctor",
  },
  queueOperator: {
    route: "/appointments/queue/operator",
    moduleKey: "appointmentQueue",
    screenName: "Queue Operator",
    workflowRef: "Call, skip, recall, complete tokens",
  },
  doctorWorklist: {
    route: "/doctor/worklist",
    moduleKey: "doctorConsultation",
    screenName: "Doctor Worklist",
    workflowRef: "Queue → Start consultation → Clinical workspace",
  },
  consultationList: {
    route: "/consultations",
    moduleKey: "doctorConsultation",
    screenName: "Consultation List",
    workflowRef: "View encounter history and worklist",
  },
  consultationStart: {
    route: "/consultations/start",
    moduleKey: "doctorConsultation",
    screenName: "Start Consultation",
    workflowRef: "Appointment-linked encounter start",
  },
  consultationDetail: {
    route: "/consultations/[encounterId]",
    moduleKey: "doctorConsultation",
    screenName: "Consultation Detail",
    workflowRef: "Read-only completed encounter",
  },
  consultationEdit: {
    route: "/consultations/[encounterId]/edit",
    moduleKey: "doctorConsultation",
    screenName: "Consultation Workspace",
    workflowRef: "Draft, vitals, diagnosis, advice, complete",
  },
  consultationPrint: {
    route: "/consultations/[encounterId]/print",
    moduleKey: "doctorConsultation",
    screenName: "Consultation Print",
    workflowRef: "Printable prescription and summary",
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
