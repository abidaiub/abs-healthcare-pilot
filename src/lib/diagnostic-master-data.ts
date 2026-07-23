/**
 * Layer 2 — Tenant Diagnostic Master Management mock data.
 * ABMG tenant setup center; UI-only aligned with Phase 2 Schema Design rev.2.
 */

import { HOST_DIAGNOSTIC_TESTS } from "@/lib/host-catalog-data";

export const ABMG_BRANCHES = [
  { code: "BR-DHK-01", name: "Dhaka Central Hospital" },
  { code: "BR-CTG-02", name: "Chattogram Medical Center" },
  { code: "BR-BAR-03", name: "Barishal Diagnostic Institute" },
] as const;

export type MasterStatus = "Active" | "Inactive";

export type TenantImportedService = {
  serviceCode: string;
  serviceName: string;
  department: string;
  category: string;
  price: number;
  method: string;
  analyzer: string;
  reportDoctor: string;
  status: MasterStatus;
  sampleType: string;
  container: string;
  tatHours: number;
  branches: string[];
};

export type TestParameter = {
  code: string;
  name: string;
  unit: string;
  resultType: "Numeric" | "Text" | "Template" | "Narrative" | "Mixed";
  referenceRange: string;
  criticalLow: string;
  criticalHigh: string;
  genderRule: string;
  ageRule: string;
  displayOrder: number;
  status: MasterStatus;
};

export type SampleType = {
  code: string;
  name: string;
  department: string;
  barcodeRequired: boolean;
  status: MasterStatus;
};

export type ContainerTube = {
  code: string;
  tube: string;
  color: string;
  container: string;
  department: string;
  barcode: boolean;
  status: MasterStatus;
};

export type TestMethod = {
  code: string;
  method: string;
  department: string;
  status: MasterStatus;
};

export type ReportingMethodEntry = {
  code: string;
  method: string;
  description: string;
  status: MasterStatus;
};

export type Analyzer = {
  code: string;
  name: string;
  model: string;
  manufacturer: string;
  department: string;
  interfaceType: string;
  machineCode: string;
  lisMapping: string;
  communicationType: "HL7" | "ASTM" | "CSV" | "Manual";
  status: MasterStatus;
};

export type DiagnosticDoctor = {
  code: string;
  name: string;
  degree: string;
  specialty: string;
  phone: string;
  department: string;
  doctorTypes: string[];
  branches: string[];
  status: MasterStatus;
};

export type ReportDoctorAssignment = {
  serviceCode: string;
  serviceName: string;
  department: string;
  reportingDoctor: string;
  verifyingDoctor: string;
  consultant: string;
  isDefault: boolean;
};

export type SignatureTemplate = {
  id: string;
  name: string;
  signatureImage: string;
  sealImage: string;
  showDegree: boolean;
  showBmdc: boolean;
  showSeal: boolean;
  showQr: boolean;
  position: "Left" | "Center" | "Right";
};

export type ReportLayout = {
  id: string;
  name: string;
  type: "Lab Report" | "Radiology Report" | "Cardiology Report";
  paperSize: "A4" | "A5" | "Legal" | "Letter";
  showLogo: boolean;
  showSlogan: boolean;
  showAddress: boolean;
  showDisclaimer: boolean;
  showQr: boolean;
  preprintedPaper: boolean;
  headerOff: boolean;
  footerOff: boolean;
};

export type PrintProfile = {
  id: string;
  name: string;
  paperType: string;
  marginTop: string;
  marginBottom: string;
  marginLeft: string;
  marginRight: string;
  headerHeight: string;
  footerHeight: string;
};

export type BillingLayout = {
  id: string;
  name: string;
  type: "Cash Memo" | "Money Receipt" | "Invoice";
  paper: "A4" | "A5" | "Thermal";
  showLogo: boolean;
  showQr: boolean;
  showPatientMobile: boolean;
  showRefDoctor: boolean;
  showDueAmount: boolean;
  showVat: boolean;
};

export type ResultDisplayRule = {
  id: string;
  label: string;
  textColor: string;
  backgroundColor: string;
  bold: boolean;
  underline: boolean;
};

export const TENANT_IMPORTED_SERVICES: TenantImportedService[] = [
  { serviceCode: "CBC", serviceName: "Complete Blood Count", department: "Laboratory", category: "Hematology", price: 400, method: "Automated", analyzer: "Sysmex XN-1000", reportDoctor: "Dr. Mahmuda Khatun", status: "Active", sampleType: "Blood", container: "EDTA Purple", tatHours: 4, branches: ["BR-DHK-01", "BR-CTG-02", "BR-BAR-03"] },
  { serviceCode: "FBS", serviceName: "Fasting Blood Sugar", department: "Laboratory", category: "Biochemistry", price: 150, method: "Automated", analyzer: "Cobas e411", reportDoctor: "Dr. Mahmuda Khatun", status: "Active", sampleType: "Blood", container: "Fluoride Grey", tatHours: 4, branches: ["BR-DHK-01", "BR-CTG-02", "BR-BAR-03"] },
  { serviceCode: "HBA1C", serviceName: "HbA1c", department: "Laboratory", category: "Biochemistry", price: 800, method: "HPLC", analyzer: "Cobas e411", reportDoctor: "Dr. Mahmuda Khatun", status: "Active", sampleType: "Blood", container: "EDTA Purple", tatHours: 24, branches: ["BR-DHK-01", "BR-CTG-02"] },
  { serviceCode: "LIPID", serviceName: "Lipid Profile", department: "Laboratory", category: "Biochemistry", price: 1000, method: "Automated", analyzer: "Cobas e411", reportDoctor: "Dr. Mahmuda Khatun", status: "Active", sampleType: "Blood", container: "Plain Red", tatHours: 24, branches: ["BR-DHK-01", "BR-CTG-02", "BR-BAR-03"] },
  { serviceCode: "TSH", serviceName: "TSH", department: "Laboratory", category: "Immunology", price: 600, method: "CLIA", analyzer: "Cobas e411", reportDoctor: "Dr. Farzana Islam", status: "Active", sampleType: "Blood", container: "Plain Red", tatHours: 24, branches: ["BR-DHK-01"] },
  { serviceCode: "URINE", serviceName: "Urine R/E", department: "Laboratory", category: "Clinical Pathology", price: 200, method: "Microscopy", analyzer: "—", reportDoctor: "Dr. Mahmuda Khatun", status: "Active", sampleType: "Urine", container: "Urine Yellow", tatHours: 4, branches: ["BR-DHK-01", "BR-BAR-03"] },
  { serviceCode: "XRCHEST", serviceName: "X-Ray Chest PA View", department: "Radiology", category: "X-Ray", price: 400, method: "Imaging", analyzer: "—", reportDoctor: "Dr. Sayed Rahman", status: "Active", sampleType: "Non-Sample", container: "—", tatHours: 2, branches: ["BR-DHK-01", "BR-CTG-02"] },
  { serviceCode: "ECG", serviceName: "ECG (12-Lead)", department: "Cardiology", category: "Non-Invasive", price: 300, method: "Clinical", analyzer: "—", reportDoctor: "Dr. Farzana Islam", status: "Active", sampleType: "Non-Sample", container: "—", tatHours: 1, branches: ["BR-DHK-01", "BR-CTG-02", "BR-BAR-03"] },
];

export const HOST_CATALOG_BROWSE = HOST_DIAGNOSTIC_TESTS.map((t) => ({
  serviceCode: t.serviceCode,
  serviceName: t.serviceName,
  department: t.department,
  category: t.category,
  sampleType: t.sampleRequired ? t.sampleType : "Non-Sample",
  parameterCount: t.parameterCount,
  importReady: t.importReady,
  status: t.isActive ? "Active" as const : "Inactive" as const,
  parameters: t.parameters,
  reportGroup: t.reportGroup,
  collectionInstruction: t.collectionInstruction,
  alreadyImported: TENANT_IMPORTED_SERVICES.some((s) => s.serviceCode === t.serviceCode),
}));

export const TEST_PARAMETERS: TestParameter[] = [
  { code: "HGB", name: "Hemoglobin", unit: "g/dL", resultType: "Numeric", referenceRange: "13.0 – 17.0 (M) / 12.0 – 16.0 (F)", criticalLow: "< 7.0", criticalHigh: "> 20.0", genderRule: "Male / Female", ageRule: "Adult", displayOrder: 1, status: "Active" },
  { code: "WBC", name: "WBC", unit: "10³/µL", resultType: "Numeric", referenceRange: "4.0 – 11.0", criticalLow: "< 2.0", criticalHigh: "> 30.0", genderRule: "All", ageRule: "Adult", displayOrder: 2, status: "Active" },
  { code: "PLT", name: "Platelet", unit: "10³/µL", resultType: "Numeric", referenceRange: "150 – 450", criticalLow: "< 50", criticalHigh: "> 1000", genderRule: "All", ageRule: "Adult", displayOrder: 3, status: "Active" },
  { code: "FBS", name: "Fasting Blood Sugar", unit: "mmol/L", resultType: "Numeric", referenceRange: "3.9 – 5.5", criticalLow: "< 2.5", criticalHigh: "> 15.0", genderRule: "All", ageRule: "Adult", displayOrder: 1, status: "Active" },
  { code: "HBA1C", name: "HbA1c", unit: "%", resultType: "Numeric", referenceRange: "< 5.7", criticalLow: "—", criticalHigh: "> 14.0", genderRule: "All", ageRule: "Adult", displayOrder: 1, status: "Active" },
  { code: "TSH", name: "TSH", unit: "mIU/L", resultType: "Numeric", referenceRange: "0.4 – 4.0", criticalLow: "< 0.1", criticalHigh: "> 10.0", genderRule: "All", ageRule: "Adult", displayOrder: 1, status: "Active" },
];

export const SAMPLE_TYPES: SampleType[] = [
  { code: "SMP-BLD", name: "Blood", department: "Laboratory", barcodeRequired: true, status: "Active" },
  { code: "SMP-URN", name: "Urine", department: "Laboratory", barcodeRequired: true, status: "Active" },
  { code: "SMP-STL", name: "Stool", department: "Laboratory", barcodeRequired: true, status: "Active" },
  { code: "SMP-SRM", name: "Serum", department: "Laboratory", barcodeRequired: true, status: "Active" },
  { code: "SMP-PLS", name: "Plasma", department: "Laboratory", barcodeRequired: true, status: "Active" },
  { code: "SMP-SPT", name: "Sputum", department: "Laboratory", barcodeRequired: true, status: "Active" },
  { code: "SMP-SWB", name: "Swab", department: "Laboratory", barcodeRequired: true, status: "Active" },
];

export const CONTAINERS: ContainerTube[] = [
  { code: "CNT-EDTA", tube: "EDTA", color: "Purple", container: "EDTA Tube", department: "Laboratory", barcode: true, status: "Active" },
  { code: "CNT-FLU", tube: "Fluoride", color: "Grey", container: "Fluoride Tube", department: "Laboratory", barcode: true, status: "Active" },
  { code: "CNT-PLN", tube: "Plain", color: "Red", container: "Plain Tube", department: "Laboratory", barcode: true, status: "Active" },
  { code: "CNT-URN", tube: "Urine", color: "Yellow", container: "Urine Container", department: "Laboratory", barcode: true, status: "Active" },
  { code: "CNT-CS", tube: "Citrate", color: "Blue", container: "Citrate Tube", department: "Laboratory", barcode: true, status: "Active" },
];

export const TEST_METHODS: TestMethod[] = [
  { code: "MTH-MAN", method: "Manual", department: "Laboratory", status: "Active" },
  { code: "MTH-AUT", method: "Automated", department: "Laboratory", status: "Active" },
  { code: "MTH-ELI", method: "ELISA", department: "Laboratory", status: "Active" },
  { code: "MTH-CLI", method: "CLIA", department: "Laboratory", status: "Active" },
  { code: "MTH-MIC", method: "Microscopy", department: "Laboratory", status: "Active" },
  { code: "MTH-CUL", method: "Culture", department: "Laboratory", status: "Active" },
  { code: "MTH-HPL", method: "HPLC", department: "Laboratory", status: "Active" },
];

export const REPORTING_METHODS: ReportingMethodEntry[] = [
  { code: "RPT-MAN", method: "Manual", description: "Technologist manual entry", status: "Active" },
  { code: "RPT-ANZ", method: "Analyzer", description: "Auto-import from LIS/analyzer", status: "Active" },
  { code: "RPT-FRM", method: "Formula", description: "Calculated from other parameters", status: "Active" },
  { code: "RPT-TPL", method: "Template", description: "Structured template report", status: "Active" },
  { code: "RPT-NAR", method: "Narrative", description: "Free-text narrative report", status: "Active" },
  { code: "RPT-OUT", method: "Outsourced", description: "External lab report import", status: "Active" },
];

export const ANALYZERS: Analyzer[] = [
  { code: "ANZ-SYS", name: "Sysmex XN-1000", model: "XN-1000", manufacturer: "Sysmex", department: "Hematology", interfaceType: "HL7 v2.5", machineCode: "HEM-CBC-01", lisMapping: "CBC → HEM-CBC-01", communicationType: "HL7", status: "Active" },
  { code: "ANZ-COB", name: "Cobas e411", model: "e411", manufacturer: "Roche", department: "Immunology", interfaceType: "ASTM E1381", machineCode: "IMM-E411-01", lisMapping: "TSH/HBA1C → IMM-E411-01", communicationType: "ASTM", status: "Active" },
  { code: "ANZ-MIN", name: "Mindray BC-6800", model: "BC-6800", manufacturer: "Mindray", department: "Hematology", interfaceType: "HL7 v2.3", machineCode: "HEM-BC6800-01", lisMapping: "CBC backup → HEM-BC6800-01", communicationType: "HL7", status: "Active" },
];

export const DIAGNOSTIC_DOCTORS: DiagnosticDoctor[] = [
  { code: "DR-1014", name: "Dr. Mahmuda Khatun", degree: "MBBS, MPhil (Pathology)", specialty: "Pathology", phone: "+880 17 1111 0048", department: "Laboratory", doctorTypes: ["Reporting", "Verifying", "Pathologist"], branches: ["BR-DHK-01", "BR-CTG-02", "BR-BAR-03"], status: "Active" },
  { code: "DR-1013", name: "Dr. Sayed Rahman", degree: "MBBS, MD (Radiology)", specialty: "Radiology", phone: "+880 17 1111 0046", department: "Radiology", doctorTypes: ["Reporting", "Radiologist", "Consultant"], branches: ["BR-DHK-01", "BR-CTG-02"], status: "Active" },
  { code: "DR-1021", name: "Dr. Farzana Islam", degree: "MBBS, MD (Cardiology)", specialty: "Cardiology", phone: "+880 17 1111 0055", department: "Cardiology", doctorTypes: ["Reporting", "Verifying", "Cardiologist"], branches: ["BR-DHK-01", "BR-BAR-03"], status: "Active" },
];

export const REPORT_DOCTOR_ASSIGNMENTS: ReportDoctorAssignment[] = [
  { serviceCode: "CBC", serviceName: "Complete Blood Count", department: "Laboratory", reportingDoctor: "Dr. Mahmuda Khatun", verifyingDoctor: "Dr. Mahmuda Khatun", consultant: "—", isDefault: true },
  { serviceCode: "FBS", serviceName: "Fasting Blood Sugar", department: "Laboratory", reportingDoctor: "Dr. Mahmuda Khatun", verifyingDoctor: "Dr. Mahmuda Khatun", consultant: "—", isDefault: true },
  { serviceCode: "HBA1C", serviceName: "HbA1c", department: "Laboratory", reportingDoctor: "Dr. Mahmuda Khatun", verifyingDoctor: "Dr. Mahmuda Khatun", consultant: "—", isDefault: false },
  { serviceCode: "TSH", serviceName: "TSH", department: "Laboratory", reportingDoctor: "Dr. Farzana Islam", verifyingDoctor: "Dr. Mahmuda Khatun", consultant: "—", isDefault: false },
  { serviceCode: "XRCHEST", serviceName: "X-Ray Chest PA View", department: "Radiology", reportingDoctor: "Dr. Sayed Rahman", verifyingDoctor: "Dr. Sayed Rahman", consultant: "—", isDefault: true },
  { serviceCode: "ECG", serviceName: "ECG (12-Lead)", department: "Cardiology", reportingDoctor: "Dr. Farzana Islam", verifyingDoctor: "Dr. Farzana Islam", consultant: "—", isDefault: true },
];

export const SIGNATURE_TEMPLATES: SignatureTemplate[] = [
  { id: "SIG-001", name: "Pathology Standard", signatureImage: "/mock/signatures/mahmuda-sig.png", sealImage: "/mock/seals/abmg-seal.png", showDegree: true, showBmdc: true, showSeal: true, showQr: true, position: "Right" },
  { id: "SIG-002", name: "Radiology Standard", signatureImage: "/mock/signatures/sayed-sig.png", sealImage: "/mock/seals/abmg-seal.png", showDegree: true, showBmdc: false, showSeal: true, showQr: false, position: "Center" },
];

export const REPORT_LAYOUTS: ReportLayout[] = [
  { id: "LAY-LAB", name: "ABMG Lab Report A4", type: "Lab Report", paperSize: "A4", showLogo: true, showSlogan: true, showAddress: true, showDisclaimer: true, showQr: true, preprintedPaper: false, headerOff: false, footerOff: false },
  { id: "LAY-RAD", name: "ABMG Radiology Report", type: "Radiology Report", paperSize: "A4", showLogo: true, showSlogan: false, showAddress: true, showDisclaimer: true, showQr: false, preprintedPaper: true, headerOff: true, footerOff: true },
  { id: "LAY-CARD", name: "ABMG Cardiology Report", type: "Cardiology Report", paperSize: "A4", showLogo: true, showSlogan: true, showAddress: true, showDisclaimer: false, showQr: true, preprintedPaper: false, headerOff: false, footerOff: false },
];

export const PRINT_PROFILES: PrintProfile[] = [
  { id: "PRF-A4", name: "A4 Report", paperType: "A4", marginTop: "0.5 in", marginBottom: "0.5 in", marginLeft: "0.7 in", marginRight: "0.7 in", headerHeight: "1.2 in", footerHeight: "0.8 in" },
  { id: "PRF-A5", name: "A5 Report", paperType: "A5", marginTop: "0.4 in", marginBottom: "0.4 in", marginLeft: "0.5 in", marginRight: "0.5 in", headerHeight: "1.0 in", footerHeight: "0.6 in" },
  { id: "PRF-LEG", name: "Legal Report", paperType: "Legal", marginTop: "0.5 in", marginBottom: "0.5 in", marginLeft: "0.75 in", marginRight: "0.75 in", headerHeight: "1.2 in", footerHeight: "0.8 in" },
  { id: "PRF-T80", name: "Thermal 80mm", paperType: "Thermal 80mm", marginTop: "2 mm", marginBottom: "2 mm", marginLeft: "2 mm", marginRight: "2 mm", headerHeight: "12 mm", footerHeight: "8 mm" },
  { id: "PRF-T58", name: "Thermal 58mm", paperType: "Thermal 58mm", marginTop: "1 mm", marginBottom: "1 mm", marginLeft: "1 mm", marginRight: "1 mm", headerHeight: "10 mm", footerHeight: "6 mm" },
];

export const BILLING_LAYOUTS: BillingLayout[] = [
  { id: "BIL-CM", name: "Cash Memo — A4", type: "Cash Memo", paper: "A4", showLogo: true, showQr: true, showPatientMobile: true, showRefDoctor: true, showDueAmount: true, showVat: false },
  { id: "BIL-MR", name: "Money Receipt — Thermal", type: "Money Receipt", paper: "Thermal", showLogo: true, showQr: false, showPatientMobile: true, showRefDoctor: false, showDueAmount: true, showVat: false },
  { id: "BIL-INV", name: "Invoice — A4", type: "Invoice", paper: "A4", showLogo: true, showQr: true, showPatientMobile: true, showRefDoctor: true, showDueAmount: true, showVat: true },
];

export const RESULT_DISPLAY_RULES: ResultDisplayRule[] = [
  { id: "normal", label: "Normal Result", textColor: "#1e293b", backgroundColor: "#ffffff", bold: false, underline: false },
  { id: "high", label: "High Result", textColor: "#b45309", backgroundColor: "#fffbeb", bold: true, underline: false },
  { id: "low", label: "Low Result", textColor: "#0369a1", backgroundColor: "#f0f9ff", bold: true, underline: false },
  { id: "critical", label: "Critical Result", textColor: "#be123c", backgroundColor: "#fff1f2", bold: true, underline: true },
];

export const RESULT_DISPLAY_PREVIEW = [
  { test: "HbA1c", value: "9.8%", flag: "critical" as const },
  { test: "FBS", value: "12.5 mmol/L", flag: "high" as const },
];

export const SECURITY_SETUP_NAV = [
  { href: "/settings/users", label: "User Management" },
  { href: "/settings/roles", label: "Roles & Permissions" },
] as const;

export const DIAGNOSTIC_SETUP_NAV = [
  { href: "/settings/service-catalog", label: "Service Catalog" },
  { href: "/settings/services", label: "Imported Services" },
  { href: "/settings/test-parameters", label: "Test Parameters" },
  { href: "/settings/sample-types", label: "Sample Types" },
  { href: "/settings/containers", label: "Containers & Tubes" },
  { href: "/settings/test-methods", label: "Test Methods" },
  { href: "/settings/reporting-methods", label: "Reporting Methods" },
  { href: "/settings/analyzers", label: "Analyzers" },
  { href: "/settings/doctors", label: "Doctors" },
  { href: "/settings/report-doctors", label: "Report Doctor Assignment" },
  { href: "/settings/signatures", label: "Signature Templates" },
  { href: "/settings/report-layouts", label: "Report Layouts" },
  { href: "/settings/print-profiles", label: "Print Profiles" },
  { href: "/settings/billing-layouts", label: "Billing Print Layout" },
  { href: "/settings/result-display", label: "Result Display Rules" },
] as const;

export function getImportedService(code: string) {
  return TENANT_IMPORTED_SERVICES.find((s) => s.serviceCode === code);
}

export function getHostCatalogItem(code: string) {
  return HOST_CATALOG_BROWSE.find((s) => s.serviceCode === code);
}
