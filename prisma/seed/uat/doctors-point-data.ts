/**
 * Doctors Point Diagnostic Center UAT dataset.
 *
 * Development/UAT only. Nothing here is imported by the production seed entry point.
 * Prices follow the approved Doctors Point price list; tests that are absent from the
 * approved host catalog are recorded as catalog gaps rather than invented here.
 */

import type { PermissionAction } from "../../../src/lib/rbac/permission-catalog";

export const DOCTORS_POINT = {
  tenantCode: "DPDC",
  tenantName: "Doctors Point Diagnostic Center",
  shortCode: "DPDC",
  legalName: "Doctors Point Diagnostic Center",
  contactPerson: "Md. Nasir Uddin",
  contactMobile: "+880 1712 100100",
  contactEmail: "info@doctorspoint.test",
  address: "Sadar Road, Bhola Sadar, Bhola",
  city: "Bhola",
  district: "Bhola",
  country: "Bangladesh",
  countryCode: "BD",
  timezone: "Asia/Dhaka",
  defaultLocale: "bn-BD",
  supportedLocales: ["bn-BD", "en-BD"],
  currencyCode: "BDT",
  reportFooterText: "Doctors Point Diagnostic Center — Bhola Sadar, Bhola",
} as const;

export const DOCTORS_POINT_BRANCH = {
  code: "BR-BHL-01",
  name: "Doctors Point Diagnostic Center – Bhola Main Branch",
  branchType: "DIAGNOSTIC_CENTER" as const,
  addressLine1: "Sadar Road, Bhola Sadar, Bhola",
  city: "Bhola",
  district: "Bhola",
  phone: "+880 1712 100101",
  email: "bhola@doctorspoint.test",
} as const;

/** Operating areas from the Doctors Point deployment brief, as tenant departments. */
export const DOCTORS_POINT_DEPARTMENTS = [
  { deptCode: "DP-RECEPTION", name: "Reception and Registration", deptType: "Administrative" },
  { deptCode: "DP-CONSULT", name: "Doctor Consultation", deptType: "Clinical" },
  { deptCode: "DP-BILLING", name: "Billing and Cash Counter", deptType: "Administrative" },
  { deptCode: "DP-COLLECT", name: "Sample Collection", deptType: "Clinical" },
  { deptCode: "DP-HAEM", name: "Haematology Laboratory", deptType: "Clinical" },
  { deptCode: "DP-BIOCHEM", name: "Biochemistry Laboratory", deptType: "Clinical" },
  { deptCode: "DP-HORMONE", name: "Hormone and Immunology Laboratory", deptType: "Clinical" },
  { deptCode: "DP-ELECTRO", name: "Electrolyte Laboratory", deptType: "Clinical" },
  { deptCode: "DP-CLINPATH", name: "Urine and Clinical Pathology Laboratory", deptType: "Clinical" },
  { deptCode: "DP-VERIFY", name: "Report Verification", deptType: "Clinical" },
  { deptCode: "DP-DELIVERY", name: "Report Delivery", deptType: "Administrative" },
  { deptCode: "DP-ADMIN", name: "Administration", deptType: "Administrative" },
] as const;

export type UatRoleSeed = {
  roleCode: string;
  roleName: string;
  description: string;
  fullAccess?: boolean;
  resourceKeys?: string[];
  actions?: PermissionAction[];
  denyActions?: Record<string, PermissionAction[]>;
};

const RECEPTION_RESOURCES = [
  "/dashboard",
  "/patients",
  "/patients/new",
  "/appointments",
  "/appointments/new",
  "/appointments/queue",
  "/appointments/queue/operator",
];

const DOCTOR_RESOURCES = [
  "/dashboard",
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
  "/prescriptions/revise",
  "/prescriptions/print",
  "/prescriptions/history",
  "/lab/report-release",
  "/lab/report-release/print",
];

const LAB_SECTION_RESOURCES = [
  "/dashboard",
  "/lab/orders",
  "/lab/receipt",
  "/lab/processing",
  "/lab/lis-worklist",
  "/lab/result-entry",
  "/lab/result-entry/edit",
  "/lab/result-entry/complete",
];

/**
 * Separation of duties: entry, verification and release are three distinct roles, and the
 * discount, critical-acknowledgement and hold-clearance rights are granted individually.
 */
export const DOCTORS_POINT_ROLES: UatRoleSeed[] = [
  {
    roleCode: "DP_TENANT_ADMIN",
    roleName: "Tenant Administrator",
    description: "Doctors Point tenant administration and setup",
    fullAccess: true,
    denyActions: {
      "/lab/verification/verify": ["canApprove"],
      "/lab/report-release/release": ["canApprove"],
      "/lab/report-release/portal-publish": ["canApprove"],
    },
  },
  {
    roleCode: "DP_BRANCH_ADMIN",
    roleName: "Branch Administrator",
    description: "Bhola Main Branch operations administration",
    resourceKeys: [
      "/dashboard",
      "/settings/branches",
      "/settings/doctors",
      "/settings/doctor-schedules",
      "/settings/service-catalog",
      "/settings/services",
      "/settings/analyzers",
      "/settings/analyzers/mapping",
      "/settings/containers",
      "/settings/sample-types",
      "/settings/audit",
      "/patients",
      "/appointments",
      "/appointments/queue",
    ],
    actions: ["canView", "canCreate", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "DP_RECEPTION",
    roleName: "Reception User",
    description: "Patient registration, appointment booking and queue token issue",
    resourceKeys: RECEPTION_RESOURCES,
    actions: ["canView", "canCreate", "canEdit", "canPrint"],
  },
  {
    roleCode: "DP_DOCTOR",
    roleName: "Consultant Doctor",
    description: "Consultation, clinical notes and investigation prescription",
    resourceKeys: DOCTOR_RESOURCES,
    // canApprove required for /prescriptions/revise (follow-up medication versioning).
    actions: ["canView", "canCreate", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "DP_BILLING",
    roleName: "Billing User",
    description: "Invoice preparation from investigation advice; may authorise discount",
    resourceKeys: [
      "/dashboard",
      "/patients",
      "/diagnostic/billing",
      "/diagnostic/billing/invoice",
      "/diagnostic/billing/discount",
      "/diagnostic/billing/payment",
      "/diagnostic/billing/receipt",
      "/lab/orders",
      "/lab/orders/new",
      "/prescriptions",
    ],
    actions: ["canView", "canCreate", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "DP_CASH",
    roleName: "Cash Collection User",
    description: "Payment collection and cash memo printing; cannot authorise discount",
    resourceKeys: [
      "/dashboard",
      "/diagnostic/billing",
      "/diagnostic/billing/payment",
      "/diagnostic/billing/receipt",
    ],
    actions: ["canView", "canCreate", "canPrint"],
    denyActions: {
      "/diagnostic/billing": ["canApprove"],
    },
  },
  {
    roleCode: "DP_COLLECTION",
    roleName: "Sample Collection User",
    description: "Sample collection, container determination, label printing and recollection",
    resourceKeys: [
      "/dashboard",
      "/lab/orders",
      "/lab/orders/confirm",
      "/lab/orders/collect",
      "/lab/collection",
      "/lab/sample-collection",
      "/lab/samples/label",
      "/lab/label-print",
      "/lab/receipt",
    ],
    actions: ["canView", "canCreate", "canEdit", "canPrint"],
  },
  {
    roleCode: "DP_TECH_HAEM",
    roleName: "Haematology Technician",
    description: "Haematology section processing and result entry",
    resourceKeys: LAB_SECTION_RESOURCES,
    actions: ["canView", "canCreate", "canEdit"],
  },
  {
    roleCode: "DP_TECH_BIOCHEM",
    roleName: "Biochemistry Technician",
    description: "Biochemistry section processing and result entry",
    resourceKeys: LAB_SECTION_RESOURCES,
    actions: ["canView", "canCreate", "canEdit"],
  },
  {
    roleCode: "DP_TECH_HORMONE",
    roleName: "Hormone Technician",
    description: "Hormone and immunology section processing and result entry",
    resourceKeys: LAB_SECTION_RESOURCES,
    actions: ["canView", "canCreate", "canEdit"],
  },
  {
    roleCode: "DP_TECH_ELECTRO",
    roleName: "Electrolyte Technician",
    description: "Electrolyte section processing and result entry",
    resourceKeys: LAB_SECTION_RESOURCES,
    actions: ["canView", "canCreate", "canEdit"],
  },
  {
    roleCode: "DP_TECH_CLINPATH",
    roleName: "Clinical Pathology Technician",
    description: "Urine and clinical pathology section processing and result entry",
    resourceKeys: LAB_SECTION_RESOURCES,
    actions: ["canView", "canCreate", "canEdit"],
  },
  {
    roleCode: "DP_REPORT_ENTRY",
    roleName: "Report Entry User",
    description: "Reviews imported results and completes drafts; cannot verify or release",
    resourceKeys: [
      "/dashboard",
      "/lab/result-entry",
      "/lab/result-entry/edit",
      "/lab/result-entry/complete",
      "/lab/result-entry/reopen",
      "/lab/lis-worklist",
      "/lab/lis-worklist/import",
      "/lab/corrections",
    ],
    actions: ["canView", "canCreate", "canEdit"],
  },
  {
    roleCode: "DP_LIS_RECONCILE",
    roleName: "LIS Reconciliation Officer",
    description: "Resolves quarantined analyzer messages and maintains analyzer mappings",
    resourceKeys: [
      "/dashboard",
      "/lab/lis-worklist",
      "/lab/lis-worklist/import",
      "/lab/lis-worklist/reconcile",
      "/lab/result-entry",
      "/lab/result-entry/override-import",
      "/settings/analyzers",
      "/settings/analyzers/mapping",
    ],
    actions: ["canView", "canCreate", "canEdit", "canApprove"],
  },
  {
    roleCode: "DP_VERIFY_DOCTOR",
    roleName: "Report Verification Doctor",
    description: "Verifies laboratory results and acknowledges critical values",
    resourceKeys: [
      "/dashboard",
      "/lab/result-entry",
      "/lab/result-entry/critical-acknowledge",
      "/lab/verification",
      "/lab/verification/review",
      "/lab/verification/verify",
      "/lab/verification/reject",
      "/lab/verification/history",
      "/lab/corrections",
    ],
    actions: ["canView", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "DP_REPORT_DELIVERY",
    roleName: "Report Delivery User",
    description: "Authorises release, publishes to portal and delivers printed reports",
    resourceKeys: [
      "/dashboard",
      "/lab/report-release",
      "/lab/report-release/prepare",
      "/lab/report-release/release",
      "/lab/report-release/print",
      "/lab/report-release/download",
      "/lab/report-release/reprint",
      "/lab/report-release/portal-publish",
      "/lab/report-release/history",
      "/settings/patient-portal",
    ],
    actions: ["canView", "canEdit", "canApprove", "canPrint"],
  },
  {
    roleCode: "DP_HOLD_OFFICER",
    roleName: "Release Hold Officer",
    description: "Applies and clears billing and quality holds under recorded authority",
    resourceKeys: [
      "/dashboard",
      "/lab/report-release",
      "/lab/report-release/billing-hold",
      "/lab/report-release/quality-hold",
      "/lab/report-release/history",
      "/diagnostic/billing",
    ],
    actions: ["canView", "canEdit", "canApprove"],
  },
];

export const DOCTORS_POINT_USERS = [
  { username: "dp.tenant.admin", fullName: "Tenant Administrator", roleCode: "DP_TENANT_ADMIN", phone: "+880 1712 100110" },
  { username: "dp.branch.admin", fullName: "Branch Administrator", roleCode: "DP_BRANCH_ADMIN", phone: "+880 1712 100111" },
  { username: "dp.reception", fullName: "Reception User", roleCode: "DP_RECEPTION", phone: "+880 1712 100112" },
  { username: "dp.billing", fullName: "Billing User", roleCode: "DP_BILLING", phone: "+880 1712 100113" },
  { username: "dp.cash", fullName: "Cash Collection User", roleCode: "DP_CASH", phone: "+880 1712 100114" },
  { username: "dp.collection", fullName: "Sample Collection User", roleCode: "DP_COLLECTION", phone: "+880 1712 100115" },
  { username: "dp.tech.haem", fullName: "Haematology Technician", roleCode: "DP_TECH_HAEM", phone: "+880 1712 100116" },
  { username: "dp.tech.biochem", fullName: "Biochemistry Technician", roleCode: "DP_TECH_BIOCHEM", phone: "+880 1712 100117" },
  { username: "dp.tech.hormone", fullName: "Hormone Technician", roleCode: "DP_TECH_HORMONE", phone: "+880 1712 100118" },
  { username: "dp.tech.electro", fullName: "Electrolyte Technician", roleCode: "DP_TECH_ELECTRO", phone: "+880 1712 100119" },
  { username: "dp.tech.clinpath", fullName: "Clinical Pathology Technician", roleCode: "DP_TECH_CLINPATH", phone: "+880 1712 100120" },
  { username: "dp.report.entry", fullName: "Report Entry User", roleCode: "DP_REPORT_ENTRY", phone: "+880 1712 100121" },
  { username: "dp.lis.reconcile", fullName: "LIS Reconciliation Officer", roleCode: "DP_LIS_RECONCILE", phone: "+880 1712 100122" },
  { username: "dp.verify.doctor", fullName: "Report Verification Doctor", roleCode: "DP_VERIFY_DOCTOR", phone: "+880 1712 100123" },
  { username: "dp.report.delivery", fullName: "Report Delivery User", roleCode: "DP_REPORT_DELIVERY", phone: "+880 1712 100124" },
  { username: "dp.hold.officer", fullName: "Release Hold Officer", roleCode: "DP_HOLD_OFFICER", phone: "+880 1712 100125" },
  { username: "dr.farhana.rahman", fullName: "Dr. Farhana Rahman", roleCode: "DP_DOCTOR", phone: "+880 1712 100130" },
  { username: "dr.kamrul.hasan", fullName: "Dr. Kamrul Hasan", roleCode: "DP_DOCTOR", phone: "+880 1712 100131" },
] as const;

export type UatDoctorSeed = {
  doctorCode: string;
  doctorName: string;
  degree: string;
  specialty: string;
  deptCode: string;
  bmdcNo: string;
  phone: string;
  consultationFee: number;
  linkedUsername?: string;
  isConsultant?: boolean;
  isReporting?: boolean;
  isVerifying?: boolean;
  isPathologist?: boolean;
  /** dayOfWeek uses the MOD-17 convention, 0 = Sunday. */
  schedule?: Array<{ dayOfWeek: number; startTime: string; endTime: string; slotDuration: number; chamber: string }>;
};

const MORNING_DAYS = [0, 1, 2, 3, 4, 6];
const EVENING_DAYS = [0, 1, 2, 3, 4, 6];

export const DOCTORS_POINT_DOCTORS: UatDoctorSeed[] = [
  {
    doctorCode: "DP-DR-001",
    doctorName: "Dr. Farhana Rahman",
    degree: "MBBS, FCPS (Medicine)",
    specialty: "Medicine",
    deptCode: "DP-CONSULT",
    bmdcNo: "A-54211",
    phone: "+880 1712 100130",
    consultationFee: 800,
    linkedUsername: "dr.farhana.rahman",
    isConsultant: true,
    schedule: MORNING_DAYS.map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "13:00",
      slotDuration: 20,
      chamber: "Chamber 1",
    })),
  },
  {
    doctorCode: "DP-DR-002",
    doctorName: "Dr. Kamrul Hasan",
    degree: "MBBS, MD (General Medicine)",
    specialty: "General Medicine",
    deptCode: "DP-CONSULT",
    bmdcNo: "A-61874",
    phone: "+880 1712 100131",
    consultationFee: 700,
    linkedUsername: "dr.kamrul.hasan",
    isConsultant: true,
    schedule: EVENING_DAYS.map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "16:00",
      endTime: "21:00",
      slotDuration: 20,
      chamber: "Chamber 2",
    })),
  },
  {
    doctorCode: "DP-DR-003",
    doctorName: "Dr. Shirin Akter",
    degree: "MBBS, MPhil (Pathology)",
    specialty: "Clinical Pathology",
    deptCode: "DP-VERIFY",
    bmdcNo: "A-47320",
    phone: "+880 1712 100123",
    consultationFee: 0,
    linkedUsername: "dp.verify.doctor",
    isReporting: true,
    isVerifying: true,
    isPathologist: true,
  },
];

export type UatServiceSeed = {
  /** Host catalog service code — the tenant service is imported, never invented. */
  hostServiceCode: string;
  displayName: string;
  /** Doctors Point published rate in BDT. */
  price: number;
  /** Tenant department that performs the test. */
  deptCode: string;
};

/** Doctors Point published price list. */
export const DOCTORS_POINT_PRICE_LIST: UatServiceSeed[] = [
  { hostServiceCode: "CBC", displayName: "CBC", price: 500, deptCode: "DP-HAEM" },
  { hostServiceCode: "ESR", displayName: "ESR", price: 300, deptCode: "DP-HAEM" },
  { hostServiceCode: "BGRH", displayName: "Blood Group & Rh", price: 250, deptCode: "DP-HAEM" },
  { hostServiceCode: "FBS", displayName: "Fasting Blood Sugar", price: 250, deptCode: "DP-BIOCHEM" },
  { hostServiceCode: "RBS", displayName: "Random Blood Sugar", price: 250, deptCode: "DP-BIOCHEM" },
  { hostServiceCode: "HBA1C", displayName: "HbA1c", price: 900, deptCode: "DP-BIOCHEM" },
  { hostServiceCode: "CREAT", displayName: "Serum Creatinine", price: 500, deptCode: "DP-BIOCHEM" },
  { hostServiceCode: "UREA", displayName: "Serum Urea", price: 450, deptCode: "DP-BIOCHEM" },
  { hostServiceCode: "LIPID", displayName: "Lipid Profile", price: 1200, deptCode: "DP-BIOCHEM" },
  { hostServiceCode: "SGPT", displayName: "ALT/SGPT", price: 450, deptCode: "DP-BIOCHEM" },
  { hostServiceCode: "ELECTRO", displayName: "Serum Electrolytes", price: 1200, deptCode: "DP-ELECTRO" },
  { hostServiceCode: "TSH", displayName: "TSH", price: 1000, deptCode: "DP-HORMONE" },
  { hostServiceCode: "FT4", displayName: "Free T4", price: 1000, deptCode: "DP-HORMONE" },
  { hostServiceCode: "URINE", displayName: "Urine R/E", price: 300, deptCode: "DP-CLINPATH" },
  { hostServiceCode: "PREG", displayName: "Pregnancy Test", price: 400, deptCode: "DP-CLINPATH" },
];

/**
 * Requested during scenario design but absent from the approved host catalog. Recorded as a
 * documented catalog gap instead of being invented as an unsupported test.
 */
export const DOCTORS_POINT_CATALOG_GAPS = [
  {
    requestedTest: "Serum Ferritin",
    requestedFor: "Patient Case 2 — Thyroid and general weakness",
    reason: "No approved host catalog service exists for Serum Ferritin.",
    action: "Not seeded. Requires host catalog governance approval before it can be offered.",
  },
] as const;

export type UatAnalyzerSeed = {
  analyzerCode: string;
  machineName: string;
  model: string;
  manufacturer: string;
  interfaceType: string;
  protocol: string;
  deptCode: string;
  /** Machine test code → host service code, used to build AnalyzerMapping rows. */
  mappings: Array<{ machineTestCode: string; hostServiceCode: string; parameterCode?: string }>;
};

export const DOCTORS_POINT_ANALYZERS: UatAnalyzerSeed[] = [
  {
    analyzerCode: "DP-HAEM-01",
    machineName: "Sysmex XN-550",
    model: "XN-550",
    manufacturer: "Sysmex",
    interfaceType: "HL7",
    protocol: "HL7-2.5",
    deptCode: "DP-HAEM",
    mappings: [
      { machineTestCode: "HGB", hostServiceCode: "CBC", parameterCode: "HGB" },
      { machineTestCode: "WBC", hostServiceCode: "CBC", parameterCode: "WBC" },
      { machineTestCode: "PLT", hostServiceCode: "CBC", parameterCode: "PLT" },
      { machineTestCode: "ESR", hostServiceCode: "ESR", parameterCode: "ESR" },
    ],
  },
  {
    analyzerCode: "DP-BIO-01",
    machineName: "Mindray BS-240",
    model: "BS-240",
    manufacturer: "Mindray",
    interfaceType: "ASTM",
    protocol: "ASTM-E1394",
    deptCode: "DP-BIOCHEM",
    mappings: [
      { machineTestCode: "GLU", hostServiceCode: "FBS", parameterCode: "GLU" },
      { machineTestCode: "GLUR", hostServiceCode: "RBS", parameterCode: "GLU" },
      { machineTestCode: "HBA1C", hostServiceCode: "HBA1C", parameterCode: "HBA1C" },
      { machineTestCode: "CREA", hostServiceCode: "CREAT", parameterCode: "CREAT" },
      { machineTestCode: "UREA", hostServiceCode: "UREA", parameterCode: "UREA" },
      { machineTestCode: "ALT", hostServiceCode: "SGPT", parameterCode: "SGPT" },
    ],
  },
  {
    analyzerCode: "DP-HORM-01",
    machineName: "Roche Cobas e411",
    model: "e411",
    manufacturer: "Roche",
    interfaceType: "HL7",
    protocol: "HL7-2.5",
    deptCode: "DP-HORMONE",
    mappings: [
      { machineTestCode: "TSH", hostServiceCode: "TSH", parameterCode: "TSH" },
      { machineTestCode: "FT4", hostServiceCode: "FT4", parameterCode: "FT4" },
    ],
  },
  {
    analyzerCode: "DP-ELEC-01",
    machineName: "Erba Elite 5",
    model: "Elite-5",
    manufacturer: "Erba",
    interfaceType: "ASTM",
    protocol: "ASTM-E1394",
    deptCode: "DP-ELECTRO",
    mappings: [
      { machineTestCode: "NA", hostServiceCode: "ELECTRO", parameterCode: "NA" },
      { machineTestCode: "K", hostServiceCode: "ELECTRO", parameterCode: "K" },
      { machineTestCode: "CL", hostServiceCode: "ELECTRO", parameterCode: "CL" },
    ],
  },
];

export type UatPatientSeed = {
  patientNumber: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  gender: "MALE" | "FEMALE";
  estimatedAge: number;
  mobile?: string;
  addressLine1: string;
  city: string;
  district: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianMobile?: string;
  caseNote: string;
};

export const DOCTORS_POINT_PATIENTS: UatPatientSeed[] = [
  {
    patientNumber: "DP-000001",
    firstName: "Md. Rahim",
    lastName: "Uddin",
    gender: "MALE",
    estimatedAge: 52,
    mobile: "+880 1712 200001",
    addressLine1: "Bhola Sadar",
    city: "Bhola",
    district: "Bhola",
    caseNote: "Case 1 — Diabetes and kidney follow-up under Dr. Farhana Rahman",
  },
  {
    patientNumber: "DP-000002",
    firstName: "Jannatul",
    lastName: "Ferdous",
    gender: "FEMALE",
    estimatedAge: 34,
    mobile: "+880 1712 200002",
    addressLine1: "Borhanuddin",
    city: "Borhanuddin",
    district: "Bhola",
    caseNote: "Case 2 — Thyroid and general weakness under Dr. Kamrul Hasan",
  },
  {
    patientNumber: "DP-000003",
    firstName: "Master Samiul",
    lastName: "Islam",
    gender: "MALE",
    estimatedAge: 12,
    addressLine1: "Char Fasson",
    city: "Char Fasson",
    district: "Bhola",
    guardianName: "Md. Nurul Islam",
    guardianRelation: "Father",
    guardianMobile: "+880 1712 200003",
    caseNote: "Case 3 — Paediatric fever and electrolyte assessment under Dr. Farhana Rahman",
  },
];

/**
 * Portal login seed for UAT. Case 3 uses an explicit guardian patient + delegation —
 * portal rights are never inferred from demographic guardian fields.
 */
export type UatPortalAccountSeed = {
  /** Clinical patient number that owns the portal account. */
  patientNumber: string;
  /** Optional override; defaults to the patient's normalised mobile. */
  username?: string;
  caseLabel: string;
};

export type UatPortalDelegationSeed = {
  /** Minor / dependent patient number (grantor). */
  grantorPatientNumber: string;
  /** Portal account owner patient number (grantee). */
  granteePatientNumber: string;
  relationship: string;
  accessLevel: string;
  consentReference: string;
};

/** Guardian registered as a separate MPI record so they can hold a portal account. */
export const DOCTORS_POINT_GUARDIAN_PATIENT: UatPatientSeed = {
  patientNumber: "DP-000004",
  firstName: "Md. Nurul",
  lastName: "Islam",
  gender: "MALE",
  estimatedAge: 42,
  mobile: "+880 1712 200003",
  addressLine1: "Char Fasson",
  city: "Char Fasson",
  district: "Bhola",
  caseNote:
    "Case 3 guardian — portal account holder; access to Master Samiul Islam requires an explicit delegation",
};

export const DOCTORS_POINT_PORTAL_ACCOUNTS: UatPortalAccountSeed[] = [
  {
    patientNumber: "DP-000001",
    caseLabel: "Case 1 — Md. Rahim Uddin",
  },
  {
    patientNumber: "DP-000002",
    caseLabel: "Case 2 — Jannatul Ferdous",
  },
  {
    patientNumber: "DP-000004",
    caseLabel: "Case 3 guardian — Md. Nurul Islam",
  },
];

export const DOCTORS_POINT_PORTAL_DELEGATIONS: UatPortalDelegationSeed[] = [
  {
    grantorPatientNumber: "DP-000003",
    granteePatientNumber: "DP-000004",
    relationship: "Father",
    accessLevel: "READ_ONLY",
    consentReference: "UAT-CONSENT-CASE3-GUARDIAN-2026",
  },
];
