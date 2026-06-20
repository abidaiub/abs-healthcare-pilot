/**
 * Host diagnostic catalog seed definitions.
 * Aligned with Sample Data Dictionary v2 §11–12 and Phase 2 Schema Design.
 */

export type HostDepartmentSeed = {
  deptCode: string;
  name: string;
  deptType: string;
};

export type HostCategorySeed = {
  deptCode: string;
  categoryCode: string;
  name: string;
  categoryType: string;
};

export type HostSampleTypeSeed = {
  typeCode: string;
  sampleType: string;
};

export type HostSampleContainerSeed = {
  containerCode: string;
  containerType: string;
  tubeColor: string;
  deptCode?: string;
  collectionInstruction?: string;
  barcodeRequired?: boolean;
  sampleRequired?: boolean;
  volumeMl?: number;
};

export type HostReportingMethodSeed = {
  methodCode: string;
  methodName: string;
  description?: string;
};

/** Host-level method codes — tenant TestMethod rows are created on import when needed. */
export type HostTestMethodReferenceSeed = {
  methodCode: string;
  methodName: string;
  deptCode?: string;
};

export type HostServiceParameterSeed = {
  parameterCode: string;
  parameterName: string;
  unit?: string;
  resultType:
    | "NUMERIC"
    | "TEXT"
    | "LONG_TEXT"
    | "BOOLEAN"
    | "OPTION_LIST"
    | "CULTURE"
    | "NARRATIVE"
    | "CALCULATED";
  displayOrder: number;
  isRequired?: boolean;
};

export type HostServiceSeed = {
  serviceCode: string;
  serviceName: string;
  shortName?: string;
  deptCode: string;
  categoryCode: string;
  basePrice: number;
  isSampleRequired?: boolean;
  isBarcodeRequired?: boolean;
  isLabTest?: boolean;
  resultMode: string;
  sampleTypeCode?: string;
  containerCode?: string;
  reportingMethodCode?: string;
  testMethodCode?: string;
  specimenInstruction?: string;
  fastingRequired?: boolean;
  parameters?: HostServiceParameterSeed[];
};

export const HOST_DEPARTMENTS: HostDepartmentSeed[] = [
  { deptCode: "LAB", name: "Laboratory", deptType: "Clinical" },
  { deptCode: "RAD", name: "Radiology", deptType: "Clinical" },
];

export const HOST_CATEGORIES: HostCategorySeed[] = [
  { deptCode: "LAB", categoryCode: "HEM", name: "Hematology", categoryType: "Laboratory" },
  { deptCode: "LAB", categoryCode: "BIO", name: "Biochemistry", categoryType: "Laboratory" },
  { deptCode: "LAB", categoryCode: "IMM", name: "Immunology", categoryType: "Laboratory" },
  { deptCode: "LAB", categoryCode: "MIC", name: "Microbiology", categoryType: "Laboratory" },
  { deptCode: "LAB", categoryCode: "CLP", name: "Clinical Pathology", categoryType: "Laboratory" },
  { deptCode: "RAD", categoryCode: "XRY", name: "X-Ray", categoryType: "Radiology" },
];

export const HOST_SAMPLE_TYPES: HostSampleTypeSeed[] = [
  { typeCode: "BLOOD", sampleType: "Blood" },
  { typeCode: "URINE", sampleType: "Urine" },
  { typeCode: "STOOL", sampleType: "Stool" },
  { typeCode: "NON_SAMPLE", sampleType: "Non-Sample" },
];

export const HOST_SAMPLE_CONTAINERS: HostSampleContainerSeed[] = [
  {
    containerCode: "EDTA",
    containerType: "EDTA Tube",
    tubeColor: "Purple",
    deptCode: "LAB",
    collectionInstruction: "Mix gently after collection.",
    barcodeRequired: true,
    sampleRequired: true,
    volumeMl: 3,
  },
  {
    containerCode: "FLUORIDE",
    containerType: "Fluoride Tube",
    tubeColor: "Grey",
    deptCode: "LAB",
    collectionInstruction: "Collect after 8–12 hours fasting for glucose tests.",
    barcodeRequired: true,
    sampleRequired: true,
    volumeMl: 2,
  },
  {
    containerCode: "PLAIN",
    containerType: "Plain Tube",
    tubeColor: "Red",
    deptCode: "LAB",
    barcodeRequired: true,
    sampleRequired: true,
    volumeMl: 5,
  },
  {
    containerCode: "URINE_CUP",
    containerType: "Urine Container",
    tubeColor: "Yellow",
    deptCode: "LAB",
    collectionInstruction: "Mid-stream clean-catch sample preferred.",
    barcodeRequired: false,
    sampleRequired: true,
    volumeMl: 50,
  },
];

export const HOST_REPORTING_METHODS: HostReportingMethodSeed[] = [
  { methodCode: "MANUAL_REPORT", methodName: "Manual Report", description: "Technologist/pathologist manual entry" },
  { methodCode: "ANALYZER_IMPORTED", methodName: "Analyzer Imported", description: "Results imported from analyzer/LIS" },
  { methodCode: "TEMPLATE_BASED", methodName: "Template Based", description: "Structured template report" },
  { methodCode: "FORMULA_BASED", methodName: "Formula Based", description: "Calculated derived results" },
  { methodCode: "RADIOLOGY_NARRATIVE", methodName: "Radiology Narrative", description: "Radiology narrative report" },
];

export const HOST_TEST_METHOD_REFERENCES: HostTestMethodReferenceSeed[] = [
  { methodCode: "MANUAL", methodName: "Manual", deptCode: "LAB" },
  { methodCode: "AUTOMATED", methodName: "Automated", deptCode: "LAB" },
  { methodCode: "ELISA", methodName: "ELISA", deptCode: "LAB" },
  { methodCode: "CLIA", methodName: "CLIA", deptCode: "LAB" },
  { methodCode: "MICROSCOPY", methodName: "Microscopy", deptCode: "LAB" },
  { methodCode: "HPLC", methodName: "HPLC", deptCode: "LAB" },
  { methodCode: "CULTURE", methodName: "Culture", deptCode: "LAB" },
  { methodCode: "IMAGING", methodName: "Imaging", deptCode: "RAD" },
  { methodCode: "OUTSOURCED", methodName: "Outsourced", deptCode: "LAB" },
];

export const HOST_SERVICES: HostServiceSeed[] = [
  {
    serviceCode: "CBC",
    serviceName: "Complete Blood Count",
    shortName: "CBC",
    deptCode: "LAB",
    categoryCode: "HEM",
    basePrice: 400,
    sampleTypeCode: "BLOOD",
    containerCode: "EDTA",
    reportingMethodCode: "ANALYZER_IMPORTED",
    testMethodCode: "AUTOMATED",
    resultMode: "NUMERIC",
    parameters: [
      { parameterCode: "HGB", parameterName: "Hemoglobin", unit: "g/dL", resultType: "NUMERIC", displayOrder: 1, isRequired: true },
      { parameterCode: "WBC", parameterName: "WBC Count", unit: "/cumm", resultType: "NUMERIC", displayOrder: 2, isRequired: true },
      { parameterCode: "PLT", parameterName: "Platelets", unit: "/cumm", resultType: "NUMERIC", displayOrder: 3, isRequired: true },
    ],
  },
  {
    serviceCode: "HGB",
    serviceName: "Hemoglobin",
    shortName: "Hb",
    deptCode: "LAB",
    categoryCode: "HEM",
    basePrice: 150,
    sampleTypeCode: "BLOOD",
    containerCode: "EDTA",
    reportingMethodCode: "ANALYZER_IMPORTED",
    testMethodCode: "AUTOMATED",
    resultMode: "NUMERIC",
    parameters: [
      { parameterCode: "HGB", parameterName: "Hemoglobin", unit: "g/dL", resultType: "NUMERIC", displayOrder: 1, isRequired: true },
    ],
  },
  {
    serviceCode: "BGRH",
    serviceName: "Blood Group & Rh Factor",
    shortName: "Blood Group",
    deptCode: "LAB",
    categoryCode: "HEM",
    basePrice: 200,
    sampleTypeCode: "BLOOD",
    containerCode: "EDTA",
    reportingMethodCode: "MANUAL_REPORT",
    testMethodCode: "MANUAL",
    resultMode: "TEXT",
    parameters: [
      { parameterCode: "ABO", parameterName: "ABO Group", resultType: "TEXT", displayOrder: 1, isRequired: true },
      { parameterCode: "RH", parameterName: "Rh Factor", resultType: "TEXT", displayOrder: 2, isRequired: true },
    ],
  },
  {
    serviceCode: "FBS",
    serviceName: "Fasting Blood Sugar",
    shortName: "FBS",
    deptCode: "LAB",
    categoryCode: "BIO",
    basePrice: 150,
    sampleTypeCode: "BLOOD",
    containerCode: "FLUORIDE",
    reportingMethodCode: "ANALYZER_IMPORTED",
    testMethodCode: "AUTOMATED",
    fastingRequired: true,
    specimenInstruction: "8–12 hours fasting required.",
    resultMode: "NUMERIC",
    parameters: [
      { parameterCode: "GLU", parameterName: "Glucose", unit: "mmol/L", resultType: "NUMERIC", displayOrder: 1, isRequired: true },
    ],
  },
  {
    serviceCode: "RBS",
    serviceName: "Random Blood Sugar",
    shortName: "RBS",
    deptCode: "LAB",
    categoryCode: "BIO",
    basePrice: 150,
    sampleTypeCode: "BLOOD",
    containerCode: "FLUORIDE",
    reportingMethodCode: "ANALYZER_IMPORTED",
    testMethodCode: "AUTOMATED",
    resultMode: "NUMERIC",
    parameters: [
      { parameterCode: "GLU", parameterName: "Glucose", unit: "mmol/L", resultType: "NUMERIC", displayOrder: 1, isRequired: true },
    ],
  },
  {
    serviceCode: "CREAT",
    serviceName: "Serum Creatinine",
    shortName: "Creatinine",
    deptCode: "LAB",
    categoryCode: "BIO",
    basePrice: 300,
    sampleTypeCode: "BLOOD",
    containerCode: "PLAIN",
    reportingMethodCode: "ANALYZER_IMPORTED",
    testMethodCode: "AUTOMATED",
    resultMode: "NUMERIC",
    parameters: [
      { parameterCode: "CREAT", parameterName: "Serum Creatinine", unit: "mg/dL", resultType: "NUMERIC", displayOrder: 1, isRequired: true },
    ],
  },
  {
    serviceCode: "SGPT",
    serviceName: "SGPT (ALT)",
    shortName: "SGPT",
    deptCode: "LAB",
    categoryCode: "BIO",
    basePrice: 300,
    sampleTypeCode: "BLOOD",
    containerCode: "PLAIN",
    reportingMethodCode: "ANALYZER_IMPORTED",
    testMethodCode: "AUTOMATED",
    resultMode: "NUMERIC",
    parameters: [
      { parameterCode: "SGPT", parameterName: "SGPT (ALT)", unit: "U/L", resultType: "NUMERIC", displayOrder: 1, isRequired: true },
    ],
  },
  {
    serviceCode: "LIPID",
    serviceName: "Lipid Profile",
    shortName: "Lipid",
    deptCode: "LAB",
    categoryCode: "BIO",
    basePrice: 1000,
    sampleTypeCode: "BLOOD",
    containerCode: "PLAIN",
    reportingMethodCode: "ANALYZER_IMPORTED",
    testMethodCode: "AUTOMATED",
    fastingRequired: true,
    specimenInstruction: "12-hour fasting preferred.",
    resultMode: "NUMERIC",
    parameters: [
      { parameterCode: "CHOL", parameterName: "Total Cholesterol", unit: "mg/dL", resultType: "NUMERIC", displayOrder: 1, isRequired: true },
      { parameterCode: "TG", parameterName: "Triglycerides", unit: "mg/dL", resultType: "NUMERIC", displayOrder: 2, isRequired: true },
      { parameterCode: "HDL", parameterName: "HDL", unit: "mg/dL", resultType: "NUMERIC", displayOrder: 3, isRequired: true },
      { parameterCode: "LDL", parameterName: "LDL", unit: "mg/dL", resultType: "NUMERIC", displayOrder: 4, isRequired: true },
    ],
  },
  {
    serviceCode: "TSH",
    serviceName: "TSH",
    shortName: "TSH",
    deptCode: "LAB",
    categoryCode: "IMM",
    basePrice: 600,
    sampleTypeCode: "BLOOD",
    containerCode: "PLAIN",
    reportingMethodCode: "ANALYZER_IMPORTED",
    testMethodCode: "CLIA",
    resultMode: "NUMERIC",
    parameters: [
      { parameterCode: "TSH", parameterName: "TSH", unit: "mIU/L", resultType: "NUMERIC", displayOrder: 1, isRequired: true },
    ],
  },
  {
    serviceCode: "URINE",
    serviceName: "Urine R/E",
    shortName: "Urine RE",
    deptCode: "LAB",
    categoryCode: "CLP",
    basePrice: 200,
    sampleTypeCode: "URINE",
    containerCode: "URINE_CUP",
    reportingMethodCode: "TEMPLATE_BASED",
    testMethodCode: "MICROSCOPY",
    resultMode: "TEMPLATE",
    parameters: [
      { parameterCode: "APPEAR", parameterName: "Appearance", resultType: "TEXT", displayOrder: 1, isRequired: true },
      { parameterCode: "PROT", parameterName: "Protein", resultType: "TEXT", displayOrder: 2, isRequired: true },
      { parameterCode: "SUGAR", parameterName: "Sugar", resultType: "TEXT", displayOrder: 3, isRequired: true },
    ],
  },
  {
    serviceCode: "BCS",
    serviceName: "Blood Culture & Sensitivity",
    shortName: "Blood C/S",
    deptCode: "LAB",
    categoryCode: "MIC",
    basePrice: 1200,
    sampleTypeCode: "BLOOD",
    containerCode: "PLAIN",
    reportingMethodCode: "MANUAL_REPORT",
    testMethodCode: "CULTURE",
    resultMode: "CULTURE",
    specimenInstruction: "Collect under aseptic conditions before antibiotic therapy when possible.",
    parameters: [
      { parameterCode: "ORG", parameterName: "Organism", resultType: "TEXT", displayOrder: 1, isRequired: true },
      { parameterCode: "SENS", parameterName: "Sensitivity", resultType: "CULTURE", displayOrder: 2, isRequired: true },
    ],
  },
  {
    serviceCode: "XRCHEST",
    serviceName: "X-Ray Chest PA View",
    shortName: "X-Ray Chest",
    deptCode: "RAD",
    categoryCode: "XRY",
    basePrice: 400,
    isSampleRequired: false,
    isBarcodeRequired: false,
    isLabTest: false,
    sampleTypeCode: "NON_SAMPLE",
    reportingMethodCode: "RADIOLOGY_NARRATIVE",
    testMethodCode: "IMAGING",
    resultMode: "NARRATIVE",
    specimenInstruction: "Remove metallic objects from chest area.",
  },
];
