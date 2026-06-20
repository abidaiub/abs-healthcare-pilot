/**
 * Host Master Service/Test Catalog — global diagnostic library mock data.
 * UI + seed planning only; aligned with Sample Data Dictionary v2.0 and Module 10.
 */

export type ServiceType =
  | "Laboratory"
  | "Radiology"
  | "Cardiology"
  | "Package"
  | "Procedure";

export type ResultType =
  | "Numeric"
  | "Text"
  | "Template"
  | "Narrative"
  | "Mixed";

export type ReportingMethod =
  | "Manual"
  | "Analyzer"
  | "Formula"
  | "Template"
  | "Narrative";

export type ReportingDoctorType =
  | "Pathologist"
  | "Radiologist"
  | "Cardiologist"
  | "Consultant";

export type HostServiceParameter = {
  name: string;
  unit: string;
  referenceRange: string;
  genderRule: string;
  ageRule: string;
  criticalLow: string;
  criticalHigh: string;
};

export type HostDiagnosticTest = {
  serviceCode: string;
  serviceName: string;
  shortCode: string;
  department: string;
  category: string;
  serviceType: ServiceType;
  description: string;
  sampleRequired: boolean;
  sampleType: string;
  containerType: string;
  tubeColor: string;
  barcodeRequired: boolean;
  collectionInstruction: string;
  resultTemplateType: ResultType;
  reportingMethod: ReportingMethod;
  testMethod: string;
  analyzer: string;
  unit: string;
  parameterCount: number;
  parameters: HostServiceParameter[];
  referenceRangeReady: boolean;
  reportGroup: string;
  reportTemplate: string;
  defaultReportingDoctorType: ReportingDoctorType;
  defaultSignatureRequired: boolean;
  defaultSealRequired: boolean;
  importReady: boolean;
  basePrice: number;
  isActive: boolean;
};

export type AiCatalogCategory = {
  id: string;
  label: string;
  serviceType: ServiceType;
  items: Array<{ code: string; name: string; inCatalog: boolean }>;
};

export type HostCatalogSeedPlan = {
  laboratory: { target: number; categories: string[] };
  radiology: { target: number; categories: string[] };
  cardiology: { target: number; categories: string[] };
  packages: { target: number; categories: string[] };
  totalTarget: number;
  parametersTarget: number;
  departments: number;
  importReadyTarget: number;
  notes: string[];
};

export type HostCatalogDocReference = {
  id: string;
  title: string;
  path: string;
  relevance: string;
};

const DEFAULT_PARAMS: HostServiceParameter[] = [];

function lab(
  partial: Partial<HostDiagnosticTest> &
    Pick<HostDiagnosticTest, "serviceCode" | "serviceName" | "shortCode" | "category" | "basePrice">,
): HostDiagnosticTest {
  return {
    department: "Laboratory",
    serviceType: "Laboratory",
    description: "",
    sampleRequired: true,
    sampleType: "Blood",
    containerType: "Plain Tube",
    tubeColor: "Red",
    barcodeRequired: true,
    collectionInstruction: "Collect after 8–12 hours fasting unless otherwise specified.",
    resultTemplateType: "Numeric",
    reportingMethod: "Analyzer",
    testMethod: "Automated",
    analyzer: "—",
    unit: "Mixed",
    parameterCount: 1,
    parameters: DEFAULT_PARAMS,
    referenceRangeReady: true,
    reportGroup: partial.category,
    reportTemplate: `${partial.category} Standard`,
    defaultReportingDoctorType: "Pathologist",
    defaultSignatureRequired: true,
    defaultSealRequired: true,
    importReady: true,
    isActive: true,
    ...partial,
  };
}

function imaging(
  partial: Partial<HostDiagnosticTest> &
    Pick<
      HostDiagnosticTest,
      "serviceCode" | "serviceName" | "shortCode" | "category" | "basePrice" | "reportingMethod"
    >,
): HostDiagnosticTest {
  return {
    department: "Radiology",
    serviceType: "Radiology",
    description: "",
    sampleRequired: false,
    sampleType: "Non-Sample",
    containerType: "—",
    tubeColor: "—",
    barcodeRequired: false,
    collectionInstruction: "Patient preparation as per modality protocol.",
    resultTemplateType: "Narrative",
    testMethod: "Imaging",
    analyzer: "—",
    unit: "N/A",
    parameterCount: 0,
    parameters: DEFAULT_PARAMS,
    referenceRangeReady: true,
    reportGroup: partial.category,
    reportTemplate: `${partial.category} Narrative`,
    defaultReportingDoctorType: "Radiologist",
    defaultSignatureRequired: true,
    defaultSealRequired: true,
    importReady: true,
    isActive: true,
    ...partial,
  };
}

function cardio(
  partial: Partial<HostDiagnosticTest> &
    Pick<
      HostDiagnosticTest,
      "serviceCode" | "serviceName" | "shortCode" | "category" | "basePrice" | "resultTemplateType"
    >,
): HostDiagnosticTest {
  return {
    department: "Cardiology",
    serviceType: "Cardiology",
    description: "",
    sampleRequired: false,
    sampleType: "Non-Sample",
    containerType: "—",
    tubeColor: "—",
    barcodeRequired: false,
    collectionInstruction: "Avoid caffeine 24 hours before test where applicable.",
    reportingMethod: "Template",
    testMethod: "Clinical",
    analyzer: "—",
    unit: "N/A",
    parameterCount: 0,
    parameters: DEFAULT_PARAMS,
    referenceRangeReady: true,
    reportGroup: "Cardiology Panel",
    reportTemplate: "Cardiology Standard",
    defaultReportingDoctorType: "Cardiologist",
    defaultSignatureRequired: true,
    defaultSealRequired: false,
    importReady: true,
    isActive: true,
    ...partial,
  };
}

function pkg(
  partial: Partial<HostDiagnosticTest> &
    Pick<HostDiagnosticTest, "serviceCode" | "serviceName" | "shortCode" | "basePrice" | "description">,
): HostDiagnosticTest {
  return {
    department: "Laboratory",
    category: "Health Package",
    serviceType: "Package",
    sampleRequired: false,
    sampleType: "Non-Sample",
    containerType: "—",
    tubeColor: "—",
    barcodeRequired: false,
    collectionInstruction: "Package booking — follow individual test prep instructions.",
    resultTemplateType: "Mixed",
    reportingMethod: "Template",
    testMethod: "Bundled",
    analyzer: "—",
    unit: "N/A",
    parameterCount: 0,
    parameters: DEFAULT_PARAMS,
    referenceRangeReady: true,
    reportGroup: "Package Panel",
    reportTemplate: "Executive Package Report",
    defaultReportingDoctorType: "Consultant",
    defaultSignatureRequired: true,
    defaultSealRequired: true,
    importReady: true,
    isActive: true,
    ...partial,
  };
}

const CBC_PARAMETERS: HostServiceParameter[] = [
  {
    name: "Hemoglobin",
    unit: "g/dL",
    referenceRange: "13.0 – 17.0 (M) / 12.0 – 16.0 (F)",
    genderRule: "Male / Female",
    ageRule: "Adult",
    criticalLow: "< 7.0",
    criticalHigh: "> 20.0",
  },
  {
    name: "WBC",
    unit: "10³/µL",
    referenceRange: "4.0 – 11.0",
    genderRule: "All",
    ageRule: "Adult",
    criticalLow: "< 2.0",
    criticalHigh: "> 30.0",
  },
  {
    name: "Platelet",
    unit: "10³/µL",
    referenceRange: "150 – 450",
    genderRule: "All",
    ageRule: "Adult",
    criticalLow: "< 50",
    criticalHigh: "> 1000",
  },
  {
    name: "RBC",
    unit: "10⁶/µL",
    referenceRange: "4.5 – 5.5 (M) / 4.0 – 5.0 (F)",
    genderRule: "Male / Female",
    ageRule: "Adult",
    criticalLow: "< 2.5",
    criticalHigh: "> 7.0",
  },
];

const LIPID_PARAMETERS: HostServiceParameter[] = [
  {
    name: "Total Cholesterol",
    unit: "mg/dL",
    referenceRange: "< 200",
    genderRule: "All",
    ageRule: "Adult",
    criticalLow: "—",
    criticalHigh: "> 300",
  },
  {
    name: "Triglycerides",
    unit: "mg/dL",
    referenceRange: "< 150",
    genderRule: "All",
    ageRule: "Adult",
    criticalLow: "—",
    criticalHigh: "> 500",
  },
  {
    name: "HDL",
    unit: "mg/dL",
    referenceRange: "> 40 (M) / > 50 (F)",
    genderRule: "Male / Female",
    ageRule: "Adult",
    criticalLow: "< 25",
    criticalHigh: "—",
  },
  {
    name: "LDL",
    unit: "mg/dL",
    referenceRange: "< 100",
    genderRule: "All",
    ageRule: "Adult",
    criticalLow: "—",
    criticalHigh: "> 190",
  },
];

export const HOST_DIAGNOSTIC_TESTS: HostDiagnosticTest[] = [
  lab({
    serviceCode: "CBC",
    serviceName: "Complete Blood Count",
    shortCode: "CBC",
    category: "Hematology",
    sampleType: "Blood",
    containerType: "EDTA Tube",
    tubeColor: "Purple",
    reportingMethod: "Analyzer",
    testMethod: "Automated Hematology",
    analyzer: "Sysmex XN-1000",
    unit: "Mixed",
    parameterCount: 4,
    parameters: CBC_PARAMETERS,
    reportGroup: "Hematology Panel",
    reportTemplate: "CBC Standard v2",
    basePrice: 400,
    collectionInstruction: "No special preparation. Mix gently after collection.",
  }),
  lab({
    serviceCode: "ESR",
    serviceName: "Erythrocyte Sedimentation Rate",
    shortCode: "ESR",
    category: "Hematology",
    containerType: "EDTA Tube",
    tubeColor: "Purple",
    reportingMethod: "Manual",
    testMethod: "Westergren",
    unit: "mm/hr",
    parameterCount: 1,
    basePrice: 200,
  }),
  lab({
    serviceCode: "CRP",
    serviceName: "CRP (C-Reactive Protein)",
    shortCode: "CRP",
    category: "Immunology",
    reportingMethod: "Analyzer",
    testMethod: "Immunoturbidimetry",
    analyzer: "Cobas c311",
    unit: "mg/L",
    parameterCount: 1,
    reportGroup: "Inflammation Panel",
    basePrice: 600,
  }),
  lab({
    serviceCode: "FBS",
    serviceName: "Fasting Blood Sugar",
    shortCode: "FBS",
    category: "Biochemistry",
    sampleType: "Blood",
    containerType: "Fluoride Tube",
    tubeColor: "Grey",
    reportingMethod: "Analyzer",
    testMethod: "Enzymatic (Hexokinase)",
    analyzer: "Cobas c311",
    unit: "mmol/L",
    parameterCount: 1,
    basePrice: 150,
    collectionInstruction: "8–12 hours fasting required.",
  }),
  lab({
    serviceCode: "2HABF",
    serviceName: "2 Hour After Breakfast",
    shortCode: "2HABF",
    category: "Biochemistry",
    containerType: "Fluoride Tube",
    tubeColor: "Grey",
    unit: "mmol/L",
    parameterCount: 1,
    basePrice: 150,
    collectionInstruction: "Collect exactly 2 hours after breakfast.",
  }),
  lab({
    serviceCode: "HBA1C",
    serviceName: "HbA1c",
    shortCode: "HbA1c",
    category: "Biochemistry",
    containerType: "EDTA Tube",
    tubeColor: "Purple",
    reportingMethod: "Analyzer",
    testMethod: "HPLC",
    analyzer: "Bio-Rad D-10",
    unit: "%",
    parameterCount: 1,
    reportGroup: "Diabetes Panel",
    basePrice: 800,
  }),
  lab({
    serviceCode: "LIPID",
    serviceName: "Lipid Profile",
    shortCode: "Lipid",
    category: "Biochemistry",
    reportingMethod: "Analyzer",
    testMethod: "Enzymatic Colorimetric",
    analyzer: "Cobas c311",
    unit: "mg/dL",
    parameterCount: 4,
    parameters: LIPID_PARAMETERS,
    reportGroup: "Cardiac Panel",
    basePrice: 1000,
    collectionInstruction: "12-hour fasting preferred.",
  }),
  lab({
    serviceCode: "CREAT",
    serviceName: "Serum Creatinine",
    shortCode: "Creatinine",
    category: "Biochemistry",
    unit: "mg/dL",
    parameterCount: 1,
    basePrice: 250,
  }),
  lab({
    serviceCode: "URIC",
    serviceName: "Uric Acid",
    shortCode: "Uric Acid",
    category: "Biochemistry",
    unit: "mg/dL",
    parameterCount: 1,
    basePrice: 300,
  }),
  lab({
    serviceCode: "SGPT",
    serviceName: "SGPT (ALT)",
    shortCode: "SGPT",
    category: "Biochemistry",
    unit: "U/L",
    parameterCount: 1,
    reportGroup: "Liver Panel",
    basePrice: 300,
  }),
  lab({
    serviceCode: "SGOT",
    serviceName: "SGOT (AST)",
    shortCode: "SGOT",
    category: "Biochemistry",
    unit: "U/L",
    parameterCount: 1,
    reportGroup: "Liver Panel",
    basePrice: 300,
  }),
  lab({
    serviceCode: "BILI",
    serviceName: "Serum Bilirubin (Total)",
    shortCode: "Bilirubin",
    category: "Biochemistry",
    unit: "mg/dL",
    parameterCount: 1,
    reportGroup: "Liver Panel",
    basePrice: 250,
  }),
  lab({
    serviceCode: "TSH",
    serviceName: "TSH",
    shortCode: "TSH",
    category: "Immunology",
    reportingMethod: "Analyzer",
    testMethod: "CLIA",
    analyzer: "Architect i2000",
    unit: "mIU/L",
    parameterCount: 1,
    reportGroup: "Thyroid Panel",
    basePrice: 600,
  }),
  lab({
    serviceCode: "FT3",
    serviceName: "Free T3",
    shortCode: "FT3",
    category: "Immunology",
    unit: "pg/mL",
    parameterCount: 1,
    reportGroup: "Thyroid Panel",
    basePrice: 600,
  }),
  lab({
    serviceCode: "FT4",
    serviceName: "Free T4",
    shortCode: "FT4",
    category: "Immunology",
    unit: "ng/dL",
    parameterCount: 1,
    reportGroup: "Thyroid Panel",
    basePrice: 600,
  }),
  lab({
    serviceCode: "HBSAG",
    serviceName: "HBsAg",
    shortCode: "HBsAg",
    category: "Serology",
    resultTemplateType: "Text",
    reportingMethod: "Analyzer",
    testMethod: "CLIA",
    unit: "N/A",
    parameterCount: 1,
    reportGroup: "Serology Panel",
    basePrice: 400,
  }),
  lab({
    serviceCode: "ANTIHCV",
    serviceName: "Anti-HCV",
    shortCode: "Anti-HCV",
    category: "Serology",
    resultTemplateType: "Text",
    reportingMethod: "Analyzer",
    unit: "N/A",
    parameterCount: 1,
    reportGroup: "Serology Panel",
    basePrice: 600,
  }),
  lab({
    serviceCode: "DENGUE",
    serviceName: "Dengue NS1 Antigen",
    shortCode: "Dengue NS1",
    category: "Serology",
    resultTemplateType: "Text",
    reportingMethod: "Manual",
    testMethod: "Rapid ICT",
    unit: "N/A",
    parameterCount: 1,
    basePrice: 700,
  }),
  lab({
    serviceCode: "TROP",
    serviceName: "Troponin-I",
    shortCode: "Trop-I",
    category: "Biochemistry",
    reportingMethod: "Analyzer",
    testMethod: "CLIA",
    analyzer: "Architect i2000",
    unit: "ng/mL",
    parameterCount: 1,
    reportGroup: "Cardiac Panel",
    basePrice: 1200,
  }),
  lab({
    serviceCode: "DDIMER",
    serviceName: "D-Dimer",
    shortCode: "D-Dimer",
    category: "Hematology",
    reportingMethod: "Analyzer",
    unit: "µg/mL",
    parameterCount: 1,
    basePrice: 1500,
  }),
  lab({
    serviceCode: "URINE",
    serviceName: "Urine R/E",
    shortCode: "Urine RE",
    category: "Clinical Pathology",
    sampleType: "Urine",
    containerType: "Urine Container",
    tubeColor: "Yellow",
    resultTemplateType: "Template",
    reportingMethod: "Manual",
    testMethod: "Microscopy",
    unit: "N/A",
    parameterCount: 12,
    basePrice: 200,
    collectionInstruction: "Mid-stream clean-catch sample preferred.",
  }),

  imaging({
    serviceCode: "XRCHEST",
    serviceName: "X-Ray Chest PA View",
    shortCode: "X-Ray Chest",
    category: "X-Ray",
    reportingMethod: "Narrative",
    basePrice: 400,
    description: "Standard posteroanterior chest radiograph.",
  }),
  imaging({
    serviceCode: "XRPNS",
    serviceName: "X-Ray PNS (Water's View)",
    shortCode: "X-Ray PNS",
    category: "X-Ray",
    reportingMethod: "Narrative",
    basePrice: 400,
  }),
  imaging({
    serviceCode: "USGABD",
    serviceName: "USG Whole Abdomen",
    shortCode: "USG Abdomen",
    category: "Ultrasonography",
    reportingMethod: "Narrative",
    basePrice: 1200,
    collectionInstruction: "6-hour fasting; full bladder for pelvic structures.",
  }),
  imaging({
    serviceCode: "USGKUB",
    serviceName: "USG KUB",
    shortCode: "USG KUB",
    category: "Ultrasonography",
    reportingMethod: "Narrative",
    basePrice: 800,
  }),
  imaging({
    serviceCode: "USGPREG",
    serviceName: "USG Pregnancy Profile",
    shortCode: "USG Pregnancy",
    category: "Ultrasonography",
    reportingMethod: "Narrative",
    basePrice: 1000,
  }),
  imaging({
    serviceCode: "CTBRAIN",
    serviceName: "CT Scan Brain (Plain)",
    shortCode: "CT Brain",
    category: "CT Scan",
    reportingMethod: "Narrative",
    basePrice: 3500,
  }),
  imaging({
    serviceCode: "CTCHEST",
    serviceName: "CT Scan Chest (HRCT)",
    shortCode: "CT Chest",
    category: "CT Scan",
    reportingMethod: "Narrative",
    basePrice: 5000,
  }),
  imaging({
    serviceCode: "MRIBRAIN",
    serviceName: "MRI Brain",
    shortCode: "MRI Brain",
    category: "MRI",
    reportingMethod: "Narrative",
    basePrice: 7000,
  }),
  imaging({
    serviceCode: "MRISPINE",
    serviceName: "MRI Lumbar Spine",
    shortCode: "MRI Spine",
    category: "MRI",
    reportingMethod: "Narrative",
    basePrice: 7000,
  }),

  cardio({
    serviceCode: "ECG",
    serviceName: "ECG (12-Lead)",
    shortCode: "ECG",
    category: "Non-Invasive",
    resultTemplateType: "Template",
    basePrice: 300,
  }),
  cardio({
    serviceCode: "ECHO",
    serviceName: "Echocardiogram (Color Doppler)",
    shortCode: "ECHO",
    category: "Non-Invasive",
    resultTemplateType: "Narrative",
    reportingMethod: "Narrative",
    basePrice: 2000,
  }),
  cardio({
    serviceCode: "ETT",
    serviceName: "ETT (Exercise Tolerance Test)",
    shortCode: "ETT",
    category: "Stress Test",
    resultTemplateType: "Narrative",
    basePrice: 2500,
    collectionInstruction: "Wear comfortable clothing; light meal 2 hours prior.",
  }),
  cardio({
    serviceCode: "HOLTER",
    serviceName: "Holter Monitoring (24h)",
    shortCode: "Holter",
    category: "Ambulatory",
    resultTemplateType: "Mixed",
    basePrice: 3500,
  }),

  pkg({
    serviceCode: "PKGEXE",
    serviceName: "Executive Health Checkup",
    shortCode: "Executive",
    basePrice: 4500,
    description:
      "CBC, FBS, Lipid Profile, Creatinine, SGPT, ECG, X-Ray Chest, USG Whole Abdomen.",
  }),
  pkg({
    serviceCode: "PKGDIA",
    serviceName: "Diabetes Care Package",
    shortCode: "Diabetes",
    basePrice: 2500,
    description: "FBS, HbA1c, Creatinine, Urine R/E, Lipid Profile, ECG.",
  }),
  pkg({
    serviceCode: "PKGCARD",
    serviceName: "Cardiac Screening Package",
    shortCode: "Cardiac",
    basePrice: 6000,
    description: "CBC, Lipid Profile, Troponin-I, ECG, Echocardiogram, ETT.",
  }),
  pkg({
    serviceCode: "PKGLIV",
    serviceName: "Liver Function Package",
    shortCode: "Liver",
    basePrice: 2200,
    description: "SGPT, SGOT, Bilirubin, Albumin, Prothrombin Time, USG Upper Abdomen.",
  }),
  pkg({
    serviceCode: "PKGKID",
    serviceName: "Kidney Function Package",
    shortCode: "Kidney",
    basePrice: 2000,
    description: "Creatinine, Uric Acid, Urine R/E, Electrolytes, USG KUB.",
  }),
];

export const AI_RECOMMENDED_CATALOG: AiCatalogCategory[] = [
  {
    id: "lab",
    label: "Laboratory",
    serviceType: "Laboratory",
    items: [
      { code: "CBC", name: "Complete Blood Count", inCatalog: true },
      { code: "ESR", name: "Erythrocyte Sedimentation Rate", inCatalog: true },
      { code: "CRP", name: "CRP (C-Reactive Protein)", inCatalog: true },
      { code: "FBS", name: "Fasting Blood Sugar", inCatalog: true },
      { code: "2HABF", name: "2 Hour After Breakfast", inCatalog: true },
      { code: "HBA1C", name: "HbA1c", inCatalog: true },
      { code: "LIPID", name: "Lipid Profile", inCatalog: true },
      { code: "CREAT", name: "Serum Creatinine", inCatalog: true },
      { code: "URIC", name: "Uric Acid", inCatalog: true },
      { code: "SGPT", name: "SGPT (ALT)", inCatalog: true },
      { code: "SGOT", name: "SGOT (AST)", inCatalog: true },
      { code: "BILI", name: "Serum Bilirubin", inCatalog: true },
      { code: "TSH", name: "TSH", inCatalog: true },
      { code: "FT3", name: "Free T3", inCatalog: true },
      { code: "FT4", name: "Free T4", inCatalog: true },
      { code: "HBSAG", name: "HBsAg", inCatalog: true },
      { code: "ANTIHCV", name: "Anti-HCV", inCatalog: true },
      { code: "DENGUE", name: "Dengue NS1 Antigen", inCatalog: true },
      { code: "TROP", name: "Troponin-I", inCatalog: true },
      { code: "DDIMER", name: "D-Dimer", inCatalog: true },
    ],
  },
  {
    id: "rad",
    label: "Radiology",
    serviceType: "Radiology",
    items: [
      { code: "XRCHEST", name: "X-Ray Chest PA View", inCatalog: true },
      { code: "XRPNS", name: "X-Ray PNS", inCatalog: true },
      { code: "USGABD", name: "USG Whole Abdomen", inCatalog: true },
      { code: "USGKUB", name: "USG KUB", inCatalog: true },
      { code: "USGPREG", name: "USG Pregnancy Profile", inCatalog: true },
      { code: "CTBRAIN", name: "CT Scan Brain", inCatalog: true },
      { code: "CTCHEST", name: "CT Scan Chest (HRCT)", inCatalog: true },
      { code: "MRIBRAIN", name: "MRI Brain", inCatalog: true },
      { code: "MRISPINE", name: "MRI Lumbar Spine", inCatalog: true },
    ],
  },
  {
    id: "cardio",
    label: "Cardiology",
    serviceType: "Cardiology",
    items: [
      { code: "ECG", name: "ECG (12-Lead)", inCatalog: true },
      { code: "ECHO", name: "Echocardiogram", inCatalog: true },
      { code: "ETT", name: "ETT (Exercise Tolerance Test)", inCatalog: true },
      { code: "HOLTER", name: "Holter Monitoring (24h)", inCatalog: true },
    ],
  },
  {
    id: "pkg",
    label: "Packages",
    serviceType: "Package",
    items: [
      { code: "PKGEXE", name: "Executive Health Checkup", inCatalog: true },
      { code: "PKGDIA", name: "Diabetes Care Package", inCatalog: true },
      { code: "PKGCARD", name: "Cardiac Screening Package", inCatalog: true },
      { code: "PKGLIV", name: "Liver Function Package", inCatalog: true },
      { code: "PKGKID", name: "Kidney Function Package", inCatalog: true },
    ],
  },
];

export const HOST_CATALOG_SEED_PLAN: HostCatalogSeedPlan = {
  laboratory: {
    target: 156,
    categories: [
      "Hematology",
      "Biochemistry",
      "Immunology",
      "Serology",
      "Clinical Pathology",
      "Microbiology",
      "Hormones",
      "Tumor Markers",
      "Coagulation",
      "Special Chemistry",
    ],
  },
  radiology: {
    target: 82,
    categories: [
      "X-Ray",
      "Ultrasonography",
      "CT Scan",
      "MRI",
      "Mammography",
      "Fluoroscopy",
      "Interventional",
    ],
  },
  cardiology: {
    target: 32,
    categories: [
      "Non-Invasive",
      "Stress Test",
      "Ambulatory",
      "Interventional",
      "Pediatric Cardiology",
    ],
  },
  packages: {
    target: 52,
    categories: [
      "Executive",
      "Diabetes",
      "Cardiac",
      "Liver",
      "Kidney",
      "Women Wellness",
      "Pre-Employment",
      "Pediatric",
      "Senior Citizen",
      "Corporate",
    ],
  },
  totalTarget: 320,
  parametersTarget: 1240,
  departments: 15,
  importReadyTarget: 320,
  notes: [
    "All seed services marked Import Ready with reference ranges, sample rules, and report templates.",
    "Tenants import from host catalog — no manual creation of common diagnostic tests.",
    "AI Recommended Catalog accelerates initial host library population.",
    "Prices in seed data follow Sample Data Dictionary v2.0 (BDT).",
  ],
};

export const HOST_CATALOG_DOC_REFERENCES: HostCatalogDocReference[] = [
  {
    id: "pb-v4",
    title: "Product Book V4 — UI/UX Blueprint",
    path: "docs/ProductBook/ABSHealthcareLite_Product_Master_Book_v4_UIUXBlueprint.md",
    relevance: "Module 10 Master Service screens, design tokens, diagnostic workflow UX.",
  },
  {
    id: "sdd",
    title: "Sample Data Dictionary v2.0",
    path: "docs/UIUXMockups/00-ABSHealthcareLite_SampleDataDictionary.md",
    relevance: "Lab catalog (§11), radiology catalog (§12), packages (§13), pricing standards.",
  },
  {
    id: "m01",
    title: "Module 01 — Company/Tenant Management",
    path: "docs/01-CompanyTenant/CompanyTenant_v1.md",
    relevance: "Host admin vs tenant admin roles, multi-tenant import workflow.",
  },
  {
    id: "m10",
    title: "Module 10 — Master Service Catalog",
    path: "docs/10-MasterServiceCatalog/MasterServiceCatalog_v1.md",
    relevance: "Global catalog (CompanyId NULL), service attributes, pricing model.",
  },
  {
    id: "m21",
    title: "Module 21 — Sample Collection & Laboratory Workflow",
    path: "docs/21-SampleCollectionLaboratoryWorkflow/SampleCollectionLaboratoryWorkflow_v1.md",
    relevance: "Sample type, container, barcode, collection instructions.",
  },
  {
    id: "m22",
    title: "Module 22 — Result Entry & Analyzer Integration",
    path: "docs/22-ResultEntryAnalyzerIntegration/ResultEntryAnalyzerIntegration_v1.md",
    relevance: "Reporting method, analyzer mapping, parameter grids.",
  },
  {
    id: "m23",
    title: "Module 23 — Result Verification & Approval",
    path: "docs/23-ResultVerificationApproval/ResultVerificationApproval_v1.md",
    relevance: "Default reporting doctor type, signature/seal requirements.",
  },
  {
    id: "m24",
    title: "Module 24 — Report Release & Delivery",
    path: "docs/24-ReportReleaseDelivery/ReportReleaseDelivery_v1.md",
    relevance: "Report templates, report groups, release governance.",
  },
];

export function getHostCatalogKpis() {
  const preview = HOST_DIAGNOSTIC_TESTS;
  const labCount = preview.filter((t) => t.serviceType === "Laboratory").length;
  const radCount = preview.filter((t) => t.serviceType === "Radiology").length;
  const cardioCount = preview.filter((t) => t.serviceType === "Cardiology").length;
  const pkgCount = preview.filter((t) => t.serviceType === "Package").length;
  const paramCount = preview.reduce((sum, t) => sum + t.parameterCount, 0);
  const importReady = preview.filter((t) => t.importReady).length;

  return {
    totalServices: { value: HOST_CATALOG_SEED_PLAN.totalTarget, hint: `${preview.length} in preview` },
    laboratoryTests: { value: HOST_CATALOG_SEED_PLAN.laboratory.target, hint: `${labCount} in preview` },
    radiologyServices: { value: HOST_CATALOG_SEED_PLAN.radiology.target, hint: `${radCount} in preview` },
    cardiologyServices: { value: HOST_CATALOG_SEED_PLAN.cardiology.target, hint: `${cardioCount} in preview` },
    packages: { value: HOST_CATALOG_SEED_PLAN.packages.target, hint: `${pkgCount} in preview` },
    departments: { value: HOST_CATALOG_SEED_PLAN.departments, hint: "Across all service types" },
    parameters: { value: HOST_CATALOG_SEED_PLAN.parametersTarget, hint: `${paramCount} in preview` },
    readyToImport: { value: HOST_CATALOG_SEED_PLAN.importReadyTarget, hint: `${importReady} preview ready` },
  };
}

export function getImportPreviewSummary(selectedCodes: string[]) {
  const services = HOST_DIAGNOSTIC_TESTS.filter((t) =>
    selectedCodes.includes(t.serviceCode),
  );
  const parameters = services.reduce((sum, t) => sum + t.parameterCount, 0);
  const withRanges = services.filter((t) => t.referenceRangeReady).length;
  const withSampleRules = services.filter(
    (t) => t.sampleRequired && t.collectionInstruction,
  ).length;

  return {
    serviceCount: services.length,
    parameterCount: parameters,
    referenceRangeCount: withRanges,
    sampleRuleCount: withSampleRules,
    services,
  };
}

export const EMPTY_HOST_TEST: HostDiagnosticTest = {
  serviceCode: "",
  serviceName: "",
  shortCode: "",
  department: "Laboratory",
  category: "Hematology",
  serviceType: "Laboratory",
  description: "",
  sampleRequired: true,
  sampleType: "Blood",
  containerType: "EDTA Tube",
  tubeColor: "Purple",
  barcodeRequired: true,
  collectionInstruction: "",
  resultTemplateType: "Numeric",
  reportingMethod: "Analyzer",
  testMethod: "Automated",
  analyzer: "",
  unit: "",
  parameterCount: 0,
  parameters: [],
  referenceRangeReady: false,
  reportGroup: "",
  reportTemplate: "",
  defaultReportingDoctorType: "Pathologist",
  defaultSignatureRequired: true,
  defaultSealRequired: true,
  importReady: false,
  basePrice: 0,
  isActive: true,
};
