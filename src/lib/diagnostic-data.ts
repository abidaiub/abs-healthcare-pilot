/**
 * Diagnostic MVP sample data — aligned with Sample Data Dictionary v2.0.
 * UI-first layer; persistence will map to Module 10/21/22/23/24 schemas later.
 */

import {
  HOST_DIAGNOSTIC_TESTS,
  type HostDiagnosticTest,
} from "@/lib/host-catalog-data";

export type { HostDiagnosticTest } from "@/lib/host-catalog-data";

export type TenantTestSetup = HostDiagnosticTest & {
  tenantPrice: number;
  discountEligible: boolean;
  tatHours: number;
  sampleCollectionRequired: boolean;
  reportTemplate: string;
  branchAvailability: string[];
};

export type DiagnosticPackage = {
  code: string;
  name: string;
  tests: string[];
  price: number;
};

export type InvestigationOrder = {
  orderNo: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: "M" | "F";
  tests: string[];
  referralDoctor: string;
  total: number;
  discount: number;
  vat: number;
  paid: number;
  due: number;
  status: "Pending Collection" | "Collected" | "In Lab" | "Verified" | "Released";
  createdAt: string;
};

export type SampleLifecycleStatus =
  | "Ordered"
  | "Pending Collection"
  | "Collected"
  | "Received"
  | "Processing"
  | "Completed"
  | "Rejected"
  | "Recollection Required";

export type SampleCollectionItem = {
  orderNo: string;
  sampleId: string;
  sampleNo: string;
  barcodeNo: string;
  patientId: string;
  patientName: string;
  tests: string[];
  sampleType: string;
  containerType: string;
  tubeColor: string;
  status: SampleLifecycleStatus;
  collectedBy?: string;
  collectedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  printStatus?: "Not Printed" | "Printed";
};

export type LisQueueItem = {
  sampleId: string;
  orderId: string;
  patientName: string;
  department: string;
  receivedTime: string;
  tatStatus: "On Time" | "At Risk" | "Overdue";
  testCode: string;
  testName: string;
  analyzerMappingCode: string;
  lisStatus:
    | "Pending Send"
    | "Sent to Analyzer"
    | "Result Received"
    | "Error"
    | "Manual Fallback";
  interfaceAuditStatus: "Pending" | "Acknowledged" | "Failed";
  rawResultPreview?: string;
  importChannel: "HL7" | "ASTM" | "Middleware" | "Manual" | "CSV" | "API";
};

export type ResultParameter = {
  name: string;
  unit: string;
  referenceRange: string;
  value: string;
  previousResult?: string;
  deltaCheck?: "Normal" | "Significant" | "Critical";
  flag?: "Normal" | "High" | "Low" | "Critical";
};

export type VerificationQueueItem = {
  resultId: string;
  orderNo: string;
  patientName: string;
  testPanel: string;
  status: "Verification Pending" | "Critical Value" | "On Hold" | "Escalated" | "Verified" | "Rejected";
  deltaCheckReady: boolean;
  criticalValue: boolean;
  enteredBy: string;
  enteredAt: string;
  verifiedBy?: string;
  verificationLevel?: string;
  criticalNotificationStatus?: "Pending" | "Notified" | "Acknowledged";
};

export type ReportReleaseItem = {
  reportNo: string;
  orderNo: string;
  patientName: string;
  patientId: string;
  tests: string[];
  status: "Release Pending" | "Released" | "Reprinted";
  governanceStatus: "Billing Hold" | "Quality Hold" | "Release Ready" | "Released" | "Portal Published";
  verifiedBy: string;
  qrCode: string;
  portalReleased: boolean;
  deliveryMethod?: string;
  identityVerification?: string;
  reprintReason?: string;
};

export { HOST_DIAGNOSTIC_TESTS };

export const TENANT_TEST_SETUP: TenantTestSetup[] = HOST_DIAGNOSTIC_TESTS.map(
  (test) => ({
    ...test,
    tenantPrice: test.basePrice,
    discountEligible: true,
    tatHours: test.category === "Hematology" ? 4 : 24,
    sampleCollectionRequired: test.sampleRequired,
    reportTemplate: `${test.reportGroup} Standard`,
    branchAvailability: ["BR-DHK-01", "BR-CTG-02", "BR-BAR-03"],
  }),
);

export const DIAGNOSTIC_PACKAGES: DiagnosticPackage[] = [
  {
    code: "PKG-DIA",
    name: "Diabetes Care Package",
    tests: ["FBS", "HBA1C", "LIPID", "URINE"],
    price: 2500,
  },
  {
    code: "PKG-EXE",
    name: "Executive Health Checkup",
    tests: ["CBC", "FBS", "LIPID", "TSH"],
    price: 4500,
  },
  {
    code: "PKG-CARD",
    name: "Cardiac Screening Package",
    tests: ["CBC", "LIPID", "CRP"],
    price: 6000,
  },
];

export const REFERRAL_DOCTORS = [
  "Self",
  "Dr. Shafiqul Islam (DR-1001)",
  "Dr. Mahmuda Khatun (DR-1014)",
  "Dr. Rezaul Karim (DR-1013)",
];

export const INVESTIGATION_ORDERS: InvestigationOrder[] = [
  {
    orderNo: "ORD-20260618-001",
    patientId: "PT-260001",
    patientName: "Mohammad Ali",
    age: 51,
    gender: "M",
    tests: ["CBC"],
    referralDoctor: "Dr. Shafiqul Islam (DR-1001)",
    total: 400,
    discount: 0,
    vat: 0,
    paid: 400,
    due: 0,
    status: "Pending Collection",
    createdAt: "18-Jun-2026 09:15",
  },
  {
    orderNo: "ORD-20260618-002",
    patientId: "PT-260008",
    patientName: "Ayesha Siddiqa",
    age: 10,
    gender: "F",
    tests: ["CBC", "CRP"],
    referralDoctor: "Dr. Ayesha Siddiqa (DR-1004)",
    total: 1000,
    discount: 0,
    vat: 0,
    paid: 1000,
    due: 0,
    status: "Pending Collection",
    createdAt: "18-Jun-2026 10:30",
  },
  {
    orderNo: "ORD-20260618-003",
    patientId: "PT-260003",
    patientName: "Rafiqul Islam",
    age: 65,
    gender: "M",
    tests: ["LIPID", "FBS", "HBA1C"],
    referralDoctor: "Dr. Kazi Tariq (DR-1003)",
    total: 1950,
    discount: 150,
    vat: 0,
    paid: 1800,
    due: 0,
    status: "Collected",
    createdAt: "18-Jun-2026 08:45",
  },
];

export const SAMPLE_COLLECTION_QUEUE: SampleCollectionItem[] = [
  {
    orderNo: "ORD-20260618-001",
    sampleId: "SMP-260618-001",
    sampleNo: "SN-260618-001",
    barcodeNo: "BC-260618-001",
    patientId: "PT-260001",
    patientName: "Mohammad Ali",
    tests: ["CBC"],
    sampleType: "Blood",
    containerType: "EDTA Tube",
    tubeColor: "Purple",
    status: "Pending Collection",
    printStatus: "Not Printed",
  },
  {
    orderNo: "ORD-20260618-002",
    sampleId: "SMP-260618-002",
    sampleNo: "SN-260618-002",
    barcodeNo: "BC-260618-002",
    patientId: "PT-260008",
    patientName: "Ayesha Siddiqa",
    tests: ["CBC", "CRP"],
    sampleType: "Blood",
    containerType: "EDTA Tube / Plain Tube",
    tubeColor: "Purple / Red",
    status: "Ordered",
    printStatus: "Not Printed",
  },
  {
    orderNo: "ORD-20260618-003",
    sampleId: "SMP-260618-003",
    sampleNo: "SN-260618-003",
    barcodeNo: "BC-260618-003",
    patientId: "PT-260003",
    patientName: "Rafiqul Islam",
    tests: ["LIPID", "FBS", "HBA1C"],
    sampleType: "Blood",
    containerType: "Plain / Fluoride / EDTA",
    tubeColor: "Red / Grey / Purple",
    status: "Collected",
    collectedBy: "Sajedur Rahman (EMP-301)",
    collectedAt: "18-Jun-2026 09:05",
    printStatus: "Printed",
  },
  {
    orderNo: "ORD-20260618-004",
    sampleId: "SMP-260618-004",
    sampleNo: "SN-260618-004",
    barcodeNo: "BC-260618-004",
    patientId: "PT-260004",
    patientName: "Fatima Begum",
    tests: ["FBS"],
    sampleType: "Blood",
    containerType: "Fluoride Tube",
    tubeColor: "Grey",
    status: "Received",
    collectedBy: "Nipa Akter (EMP-302)",
    collectedAt: "18-Jun-2026 08:30",
    receivedBy: "Sajedur Rahman (EMP-301)",
    receivedAt: "18-Jun-2026 09:15",
    printStatus: "Printed",
  },
];

export const LIS_QUEUE: LisQueueItem[] = [
  {
    sampleId: "SMP-260618-003",
    orderId: "ORD-20260618-003",
    patientName: "Rafiqul Islam",
    department: "Laboratory",
    receivedTime: "18-Jun-2026 09:20",
    tatStatus: "On Time",
    testCode: "CBC",
    testName: "Complete Blood Count",
    analyzerMappingCode: "HEM-CBC-01",
    lisStatus: "Result Received",
    interfaceAuditStatus: "Acknowledged",
    rawResultPreview: "WBC=7.2, RBC=4.8, HGB=14.1, PLT=220",
    importChannel: "HL7",
  },
  {
    sampleId: "SMP-260618-003",
    orderId: "ORD-20260618-003",
    patientName: "Rafiqul Islam",
    department: "Laboratory",
    receivedTime: "18-Jun-2026 09:20",
    tatStatus: "At Risk",
    testCode: "FBS",
    testName: "Fasting Blood Sugar",
    analyzerMappingCode: "CHEM-GLU-01",
    lisStatus: "Sent to Analyzer",
    interfaceAuditStatus: "Pending",
    importChannel: "ASTM",
  },
  {
    sampleId: "SMP-260618-003",
    orderId: "ORD-20260618-003",
    patientName: "Rafiqul Islam",
    department: "Laboratory",
    receivedTime: "18-Jun-2026 09:20",
    tatStatus: "Overdue",
    testCode: "HBA1C",
    testName: "HbA1c",
    analyzerMappingCode: "IMM-HBA1C-01",
    lisStatus: "Error",
    interfaceAuditStatus: "Failed",
    rawResultPreview: "Mapping mismatch — manual fallback required",
    importChannel: "Middleware",
  },
  {
    sampleId: "SMP-260618-004",
    orderId: "ORD-20260618-004",
    patientName: "Fatima Begum",
    department: "Laboratory",
    receivedTime: "18-Jun-2026 09:30",
    tatStatus: "On Time",
    testCode: "URINE",
    testName: "Urine R/E",
    analyzerMappingCode: "MANUAL-URINE",
    lisStatus: "Manual Fallback",
    interfaceAuditStatus: "Pending",
    importChannel: "Manual",
  },
];

export const CBC_PARAMETERS: ResultParameter[] = [
  {
    name: "Hemoglobin",
    unit: "g/dL",
    referenceRange: "13.0 - 17.0",
    value: "14.1",
    previousResult: "13.8",
    deltaCheck: "Normal",
    flag: "Normal",
  },
  {
    name: "WBC",
    unit: "10^3/uL",
    referenceRange: "4.0 - 11.0",
    value: "7.2",
    previousResult: "6.9",
    deltaCheck: "Normal",
    flag: "Normal",
  },
  {
    name: "Platelet",
    unit: "10^3/uL",
    referenceRange: "150 - 450",
    value: "220",
    previousResult: "215",
    deltaCheck: "Normal",
    flag: "Normal",
  },
  {
    name: "RBC",
    unit: "10^6/uL",
    referenceRange: "4.5 - 5.5",
    value: "4.8",
    previousResult: "4.7",
    deltaCheck: "Normal",
    flag: "Normal",
  },
];

export const VERIFICATION_QUEUE: VerificationQueueItem[] = [
  {
    resultId: "RES-260618-001",
    orderNo: "ORD-20260618-003",
    patientName: "Rafiqul Islam",
    testPanel: "Complete Blood Count",
    status: "Verification Pending",
    deltaCheckReady: true,
    criticalValue: false,
    enteredBy: "Nipa Akter (EMP-302)",
    enteredAt: "18-Jun-2026 11:20",
    verificationLevel: "Level 1 — Technologist",
    criticalNotificationStatus: "Pending",
  },
  {
    resultId: "RES-260618-002",
    orderNo: "ORD-20260618-005",
    patientName: "Fatima Begum",
    testPanel: "Fasting Blood Sugar",
    status: "Escalated",
    deltaCheckReady: true,
    criticalValue: true,
    enteredBy: "Sajedur Rahman (EMP-301)",
    enteredAt: "18-Jun-2026 11:45",
    verificationLevel: "Level 2 — Pathologist",
    criticalNotificationStatus: "Notified",
  },
];

export const REPORT_RELEASE_QUEUE: ReportReleaseItem[] = [
  {
    reportNo: "RPT-260618-001",
    orderNo: "ORD-20260618-003",
    patientName: "Rafiqul Islam",
    patientId: "PT-260003",
    tests: ["Complete Blood Count"],
    status: "Release Pending",
    governanceStatus: "Release Ready",
    verifiedBy: "Dr. Mahmuda Khatun (DR-1014)",
    qrCode: "ABMG-RPT-260618-001",
    portalReleased: false,
    deliveryMethod: "Print + Portal",
    identityVerification: "MRN + Mobile OTP",
  },
  {
    reportNo: "RPT-260618-002",
    orderNo: "ORD-20260618-001",
    patientName: "Mohammad Ali",
    patientId: "PT-260001",
    tests: ["Complete Blood Count"],
    status: "Released",
    governanceStatus: "Portal Published",
    verifiedBy: "Dr. Mahmuda Khatun (DR-1014)",
    qrCode: "ABMG-RPT-260618-002",
    portalReleased: true,
    deliveryMethod: "Portal",
    identityVerification: "Mobile OTP verified",
  },
];

export const PORTAL_REPORTS = [
  {
    reportNo: "RPT-260618-002",
    orderNo: "ORD-20260618-001",
    reportType: "Laboratory",
    doctor: "Dr. Shafiqul Islam (DR-1001)",
    tests: ["Complete Blood Count"],
    status: "Final",
    releasedAt: "18-Jun-2026 14:30",
    branch: "Dhaka Central Hospital",
  },
  {
    reportNo: "RPT-260617-014",
    orderNo: "ORD-20260617-014",
    reportType: "Laboratory",
    doctor: "Dr. Kazi Tariq (DR-1003)",
    tests: ["Lipid Profile", "FBS"],
    status: "Final",
    releasedAt: "17-Jun-2026 16:10",
    branch: "Dhaka Central Hospital",
  },
  {
    reportNo: "RPT-260616-008",
    orderNo: "ORD-20260616-008",
    reportType: "Laboratory",
    doctor: "Dr. Mahmuda Khatun (DR-1014)",
    tests: ["Urine R/E"],
    status: "Final",
    releasedAt: "—",
    branch: "Dhaka Central Hospital",
  },
];

export function getHostTestByCode(code: string) {
  return HOST_DIAGNOSTIC_TESTS.find((t) => t.serviceCode === code);
}

export function formatCurrency(amount: number) {
  return `BDT ${amount.toLocaleString("en-BD")}`;
}

export type DiagnosticDashboardStats = {
  todaysBills: number;
  todaysCollection: number;
  pendingSampleCollection: number;
  pendingResultEntry: number;
  pendingVerification: number;
  reportsReady: number;
  reportsReleasedToPortal: number;
  dueAmount: number;
  collectedToday: number;
  rejectedSamples: number;
  recollectionRequired: number;
  pendingValidation: number;
  criticalAlerts: number;
  escalatedResults: number;
  onHoldResults: number;
  blockedReports: number;
  reprints: number;
  deliveryFailures: number;
};

export const DIAGNOSTIC_WORKFLOW_STEPS = [
  {
    id: "billing",
    label: "Billing",
    description: "Investigation order & receipt",
    href: "/diagnostic/billing",
    countKey: "todaysBills" as const,
  },
  {
    id: "sample-collection",
    label: "Sample Collection",
    description: "Phlebotomy queue & barcode",
    href: "/lab/sample-collection",
    countKey: "pendingSampleCollection" as const,
  },
  {
    id: "lis",
    label: "LIS",
    description: "Analyzer interface queue",
    href: "/lab/lis-worklist",
    countKey: "pendingResultEntry" as const,
  },
  {
    id: "result-entry",
    label: "Result Entry",
    description: "Manual fallback & parameters",
    href: "/lab/result-entry",
    countKey: "pendingResultEntry" as const,
  },
  {
    id: "verification",
    label: "Verification",
    description: "Pathologist approval",
    href: "/lab/verification",
    countKey: "pendingVerification" as const,
  },
  {
    id: "report-release",
    label: "Report Release",
    description: "Print, PDF & dispatch",
    href: "/lab/report-release",
    countKey: "reportsReady" as const,
  },
  {
    id: "portal",
    label: "Portal",
    description: "Patient self-service reports",
    href: "/portal/reports",
    countKey: "reportsReleasedToPortal" as const,
  },
] as const;

export function getDiagnosticDashboardStats(): DiagnosticDashboardStats {
  const todaysCollection = INVESTIGATION_ORDERS.reduce(
    (sum, order) => sum + order.paid,
    0,
  );
  const dueAmount = INVESTIGATION_ORDERS.reduce(
    (sum, order) => sum + order.due,
    0,
  );

  return {
    todaysBills: INVESTIGATION_ORDERS.length,
    todaysCollection,
    pendingSampleCollection: SAMPLE_COLLECTION_QUEUE.filter(
      (item) => item.status === "Pending Collection",
    ).length,
    pendingResultEntry: LIS_QUEUE.filter(
      (item) =>
        item.lisStatus === "Error" ||
        item.lisStatus === "Manual Fallback" ||
        item.lisStatus === "Sent to Analyzer",
    ).length,
    pendingVerification: VERIFICATION_QUEUE.filter(
      (item) => item.status === "Verification Pending" || item.status === "Escalated",
    ).length,
    reportsReady: REPORT_RELEASE_QUEUE.filter(
      (item) => item.status === "Release Pending",
    ).length,
    reportsReleasedToPortal: REPORT_RELEASE_QUEUE.filter(
      (item) => item.portalReleased,
    ).length,
    dueAmount: dueAmount + 850,
    collectedToday: SAMPLE_COLLECTION_QUEUE.filter(
      (item) => item.status === "Collected" || item.status === "Received",
    ).length,
    rejectedSamples: SAMPLE_COLLECTION_QUEUE.filter(
      (item) => item.status === "Rejected",
    ).length,
    recollectionRequired: SAMPLE_COLLECTION_QUEUE.filter(
      (item) => item.status === "Recollection Required",
    ).length,
    pendingValidation: 3,
    criticalAlerts: VERIFICATION_QUEUE.filter((item) => item.criticalValue).length,
    escalatedResults: VERIFICATION_QUEUE.filter(
      (item) => item.status === "Escalated",
    ).length,
    onHoldResults: VERIFICATION_QUEUE.filter(
      (item) => item.status === "On Hold",
    ).length,
    blockedReports: 1,
    reprints: REPORT_RELEASE_QUEUE.filter(
      (item) => item.status === "Reprinted",
    ).length,
    deliveryFailures: 0,
  };
}

export const DEFAULT_BILLING_TESTS = ["CBC", "FBS", "HBA1C"] as const;

export function getDefaultBillingLineItems() {
  return DEFAULT_BILLING_TESTS.map((code) => {
    const test = TENANT_TEST_SETUP.find((entry) => entry.serviceCode === code);
    return {
      code,
      name: test?.serviceName ?? code,
      price: test?.tenantPrice ?? 0,
    };
  });
}
