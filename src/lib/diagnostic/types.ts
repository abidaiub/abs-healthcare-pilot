export type MasterStatus = "Active" | "Inactive";

export type HostCatalogServiceRow = {
  id: string;
  serviceCode: string;
  serviceName: string;
  shortName: string | null;
  department: string;
  departmentId: string;
  category: string;
  categoryId: string;
  sampleType: string;
  containerType: string;
  tubeColor: string;
  testMethod: string;
  reportingMethod: string;
  parameterCount: number;
  reportGroup: string;
  importReady: boolean;
  isActive: boolean;
  sampleRequired: boolean;
  barcodeRequired: boolean;
  resultMode: string;
  basePrice: number;
  collectionInstruction: string;
  parameters: HostCatalogParameterRow[];
};

export type HostCatalogParameterRow = {
  code: string;
  name: string;
  unit: string;
  resultType: string;
  displayOrder: number;
};

export type HostCatalogKpis = {
  totalServices: number;
  laboratoryTests: number;
  radiologyServices: number;
  cardiologyServices: number;
  packages: number;
  departments: number;
  parameters: number;
  readyToImport: number;
};

export type TenantOptionRow = {
  id: string;
  name: string;
  code: string;
  branches: { id: string; code: string; name: string }[];
};

export type ImportableHostServiceRow = {
  id: string;
  serviceCode: string;
  serviceName: string;
  department: string;
  category: string;
  sampleType: string;
  parameterCount: number;
  importReady: boolean;
  status: MasterStatus;
  parameters: { name: string; referenceRange: string }[];
  reportGroup: string;
  collectionInstruction: string;
  alreadyImported: boolean;
};

export type TenantImportedServiceRow = {
  id: string;
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
  tatHours: number | null;
  branches: string[];
};

export type TestParameterRow = {
  id: string;
  code: string;
  name: string;
  unit: string;
  resultType: string;
  referenceRange: string;
  criticalLow: string;
  criticalHigh: string;
  genderRule: string;
  ageRule: string;
  displayOrder: number;
  status: MasterStatus;
  tenantServiceId: string;
  tenantServiceName: string;
};

export type SampleTypeRow = {
  id: string;
  code: string;
  name: string;
  department: string;
  barcodeRequired: boolean;
  status: MasterStatus;
  scope: "Host" | "Tenant";
};

export type ContainerRow = {
  id: string;
  code: string;
  tube: string;
  color: string;
  container: string;
  department: string;
  barcode: boolean;
  status: MasterStatus;
  scope: "Host" | "Tenant";
};

export type TestMethodRow = {
  id: string;
  code: string;
  method: string;
  department: string;
  branchCode: string | null;
  status: MasterStatus;
};

export type ReportingMethodRow = {
  id: string;
  code: string;
  method: string;
  description: string;
  status: MasterStatus;
  scope: "Host" | "Tenant";
};

export type AnalyzerRow = {
  id: string;
  code: string;
  name: string;
  model: string;
  manufacturer: string;
  department: string;
  branchCode: string;
  interfaceType: string;
  machineCode: string;
  lisMapping: string;
  communicationType: string;
  status: MasterStatus;
};

export type DoctorRow = {
  id: string;
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

export type ReportDoctorAssignmentRow = {
  id: string;
  serviceCode: string;
  serviceName: string;
  department: string;
  reportingDoctor: string;
  verifyingDoctor: string;
  consultant: string;
  isDefault: boolean;
};

export type SignatureTemplateRow = {
  id: string;
  name: string;
  doctorName: string;
  department: string;
  branchCode: string | null;
  signatureImage: string;
  sealImage: string;
  showDegree: boolean;
  showBmdc: boolean;
  showSeal: boolean;
  showQr: boolean;
  position: "Left" | "Center" | "Right";
  footerText: string;
};

export type ModuleRegistryRow = {
  id: string;
  moduleCode: string;
  moduleName: string;
  moduleGroup: string;
  description: string;
  coreModule: boolean;
  status: MasterStatus;
};

export type TenantServiceOption = {
  id: string;
  serviceCode: string;
  serviceName: string;
};

export type BranchOption = {
  id: string;
  code: string;
  name: string;
};

export type DepartmentOption = {
  id: string;
  name: string;
};
