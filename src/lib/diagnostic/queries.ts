import { prisma } from "@/lib/db";
import type {
  AnalyzerRow,
  BranchOption,
  ContainerRow,
  DoctorRow,
  HostCatalogKpis,
  HostCatalogServiceRow,
  ImportableHostServiceRow,
  ModuleRegistryRow,
  ReportDoctorAssignmentRow,
  ReportingMethodRow,
  SampleTypeRow,
  SignatureTemplateRow,
  TenantImportedServiceRow,
  TenantOptionRow,
  TenantServiceOption,
  TestMethodRow,
  TestParameterRow,
} from "@/lib/diagnostic/types";

function toStatus(isActive: boolean): "Active" | "Inactive" {
  return isActive ? "Active" : "Inactive";
}

function formatReferenceRange(
  ranges: {
    gender: string | null;
    ageFromDays: number | null;
    ageToDays: number | null;
    normalLow: { toString(): string } | null;
    normalHigh: { toString(): string } | null;
    textRange: string | null;
  }[],
): { referenceRange: string; criticalLow: string; criticalHigh: string; genderRule: string; ageRule: string } {
  const primary = ranges[0];
  if (!primary) {
    return {
      referenceRange: "—",
      criticalLow: "—",
      criticalHigh: "—",
      genderRule: "All",
      ageRule: "All ages",
    };
  }

  const referenceRange =
    primary.textRange ??
    (primary.normalLow != null && primary.normalHigh != null
      ? `${primary.normalLow} – ${primary.normalHigh}`
      : "—");

  return {
    referenceRange,
    criticalLow: "—",
    criticalHigh: "—",
    genderRule: primary.gender ?? "All",
    ageRule:
      primary.ageFromDays != null || primary.ageToDays != null
        ? `${primary.ageFromDays ?? 0}–${primary.ageToDays ?? "∞"} days`
        : "All ages",
  };
}

function mapSignaturePosition(position: string): "Left" | "Center" | "Right" {
  const normalized = position.toLowerCase();
  if (normalized.includes("center")) return "Center";
  if (normalized.includes("right")) return "Right";
  return "Left";
}

export async function listTenantOptions(): Promise<TenantOptionRow[]> {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    include: {
      branches: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { tenantName: "asc" },
  });

  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.tenantName,
    code: tenant.tenantCode,
    branches: tenant.branches,
  }));
}

export async function listHostCatalogServices(): Promise<HostCatalogServiceRow[]> {
  const services = await prisma.hostService.findMany({
    where: { isActive: true },
    include: {
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      parameters: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      },
      sampleRequirements: {
        where: { isActive: true },
        take: 1,
        include: {
          sampleType: { select: { sampleType: true } },
          sampleContainer: {
            select: { containerType: true, tubeColor: true },
          },
          testMethod: { select: { methodName: true } },
          reportingMethod: { select: { methodName: true } },
        },
      },
    },
    orderBy: [{ department: { name: "asc" } }, { serviceName: "asc" }],
  });

  return services.map((service) => {
    const sampleReq = service.sampleRequirements[0];
    const deptName = service.department.name;

    return {
      id: service.id,
      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      shortName: service.shortName,
      department: deptName,
      departmentId: service.departmentId,
      category: service.category.name,
      categoryId: service.categoryId,
      sampleType: service.isSampleRequired
        ? (sampleReq?.sampleType?.sampleType ?? "—")
        : "Non-Sample",
      containerType: sampleReq?.sampleContainer?.containerType ?? "—",
      tubeColor: sampleReq?.sampleContainer?.tubeColor ?? "—",
      testMethod: sampleReq?.testMethod?.methodName ?? "—",
      reportingMethod: sampleReq?.reportingMethod?.methodName ?? service.resultMode,
      parameterCount: service.parameters.length,
      reportGroup: service.category.name,
      importReady: service.parameters.length > 0 || !service.isLabTest,
      isActive: service.isActive,
      sampleRequired: service.isSampleRequired,
      barcodeRequired: service.isBarcodeRequired,
      resultMode: service.resultMode,
      basePrice: Number(service.basePrice),
      collectionInstruction: sampleReq?.specimenInstruction ?? "",
      parameters: service.parameters.map((param) => ({
        code: param.parameterCode,
        name: param.parameterName,
        unit: param.unit ?? "—",
        resultType: param.resultType,
        displayOrder: param.displayOrder,
      })),
    };
  });
}

export async function getHostCatalogKpis(
  services: HostCatalogServiceRow[],
): Promise<HostCatalogKpis> {
  const departments = new Set(services.map((s) => s.department));
  const parameters = services.reduce((sum, s) => sum + s.parameterCount, 0);

  return {
    totalServices: services.length,
    laboratoryTests: services.filter((s) => s.department === "Laboratory").length,
    radiologyServices: services.filter((s) => s.department === "Radiology").length,
    cardiologyServices: services.filter((s) => s.department === "Cardiology").length,
    packages: services.filter((s) => s.category.toLowerCase().includes("package")).length,
    departments: departments.size,
    parameters,
    readyToImport: services.filter((s) => s.importReady).length,
  };
}

export async function listImportableHostServices(
  tenantId: string,
): Promise<ImportableHostServiceRow[]> {
  const [hostServices, importedHostIds] = await Promise.all([
    prisma.hostService.findMany({
      where: { isActive: true },
      include: {
        department: { select: { name: true } },
        category: { select: { name: true } },
        parameters: { where: { isActive: true } },
        sampleRequirements: {
          where: { isActive: true },
          take: 1,
          include: { sampleType: { select: { sampleType: true } } },
        },
      },
      orderBy: { serviceName: "asc" },
    }),
    prisma.tenantService.findMany({
      where: { tenantId, hostServiceId: { not: null }, isActive: true },
      select: { hostServiceId: true },
    }),
  ]);

  const importedSet = new Set(
    importedHostIds.map((row) => row.hostServiceId).filter(Boolean) as string[],
  );

  return hostServices.map((service) => {
    const sampleReq = service.sampleRequirements[0];
    return {
      id: service.id,
      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      department: service.department.name,
      category: service.category.name,
      sampleType: service.isSampleRequired
        ? (sampleReq?.sampleType?.sampleType ?? "—")
        : "Non-Sample",
      parameterCount: service.parameters.length,
      importReady: service.parameters.length > 0 || !service.isLabTest,
      status: toStatus(service.isActive),
      parameters: service.parameters.map((p) => ({
        name: p.parameterName,
        referenceRange: "From host catalog",
      })),
      reportGroup: service.category.name,
      collectionInstruction: sampleReq?.specimenInstruction ?? "No sample required",
      alreadyImported: importedSet.has(service.id),
    };
  });
}

export async function listTenantImportedServices(
  tenantId: string,
): Promise<TenantImportedServiceRow[]> {
  const services = await prisma.tenantService.findMany({
    where: { tenantId, isActive: true },
    include: {
      hostService: { select: { serviceCode: true } },
      department: { select: { name: true } },
      category: { select: { name: true } },
      sampleType: { select: { sampleType: true } },
      sampleContainer: { select: { containerType: true } },
      testMethod: { select: { methodName: true } },
      analyzer: { select: { machineName: true } },
      reportDoctorAssignments: {
        where: { isActive: true, defaultForReport: true },
        take: 1,
        include: { reportingDoctor: { select: { doctorName: true } } },
      },
      tenantServiceBranches: {
        where: { isActive: true, isAvailable: true },
        include: { branch: { select: { code: true } } },
      },
    },
    orderBy: { localName: "asc" },
  });

  return services.map((service) => ({
    id: service.id,
    serviceCode: service.hostService?.serviceCode ?? service.id.slice(0, 8).toUpperCase(),
    serviceName: service.localName,
    department: service.department.name,
    category: service.category.name,
    price: Number(service.price),
    method: service.testMethod?.methodName ?? "—",
    analyzer: service.analyzer?.machineName ?? "—",
    reportDoctor:
      service.reportDoctorAssignments[0]?.reportingDoctor?.doctorName ?? "—",
    status: toStatus(service.isActive),
    sampleType: service.sampleType?.sampleType ?? "—",
    container: service.sampleContainer?.containerType ?? "—",
    tatHours: service.tatHours,
    branches: service.tenantServiceBranches.map((b) => b.branch.code),
  }));
}

export async function listTenantServiceOptions(
  tenantId: string,
): Promise<TenantServiceOption[]> {
  const services = await prisma.tenantService.findMany({
    where: { tenantId, isActive: true },
    include: { hostService: { select: { serviceCode: true } } },
    orderBy: { localName: "asc" },
  });

  return services.map((service) => ({
    id: service.id,
    serviceCode: service.hostService?.serviceCode ?? service.id.slice(0, 8).toUpperCase(),
    serviceName: service.localName,
  }));
}

export async function listTestParameters(
  tenantId: string,
  tenantServiceId?: string,
): Promise<TestParameterRow[]> {
  const parameters = await prisma.serviceParameter.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(tenantServiceId ? { tenantServiceId } : {}),
    },
    include: {
      tenantService: {
        select: { localName: true, hostService: { select: { serviceCode: true } } },
      },
      referenceRanges: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: [{ tenantServiceId: "asc" }, { displayOrder: "asc" }],
  });

  return parameters.map((param) => {
    const range = formatReferenceRange(param.referenceRanges);
    return {
      id: param.id,
      code: param.parameterCode,
      name: param.parameterName,
      unit: param.unit ?? "—",
      resultType: param.resultType,
      ...range,
      displayOrder: param.displayOrder,
      status: toStatus(param.isActive),
      tenantServiceId: param.tenantServiceId,
      tenantServiceName: param.tenantService.localName,
    };
  });
}

export async function listSampleTypes(tenantId: string): Promise<SampleTypeRow[]> {
  const rows = await prisma.sampleType.findMany({
    where: {
      isActive: true,
      OR: [{ tenantId: null }, { tenantId }],
    },
    orderBy: [{ tenantId: "asc" }, { sampleType: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.typeCode,
    name: row.sampleType,
    department: "—",
    barcodeRequired: true,
    status: toStatus(row.isActive),
    scope: row.tenantId ? "Tenant" : "Host",
  }));
}

export async function listContainers(tenantId: string): Promise<ContainerRow[]> {
  const rows = await prisma.sampleContainer.findMany({
    where: {
      isActive: true,
      OR: [{ tenantId: null }, { tenantId }],
    },
    include: { department: { select: { name: true } } },
    orderBy: [{ tenantId: "asc" }, { containerType: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.containerCode,
    tube: row.containerType,
    color: row.tubeColor ?? "—",
    container: row.containerType,
    department: row.department?.name ?? "—",
    barcode: row.barcodeRequired,
    status: toStatus(row.isActive),
    scope: row.tenantId ? "Tenant" : "Host",
  }));
}

export async function listTestMethods(
  tenantId: string,
  branchId?: string,
): Promise<TestMethodRow[]> {
  const rows = await prisma.testMethod.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
    },
    include: {
      department: { select: { name: true } },
      branch: { select: { code: true } },
    },
    orderBy: { methodName: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.methodCode,
    method: row.methodName,
    department: row.department?.name ?? "—",
    branchCode: row.branch?.code ?? null,
    status: toStatus(row.isActive),
  }));
}

export async function listReportingMethods(
  tenantId: string,
): Promise<ReportingMethodRow[]> {
  const rows = await prisma.reportingMethod.findMany({
    where: {
      isActive: true,
      OR: [{ tenantId: null }, { tenantId }],
    },
    orderBy: [{ tenantId: "asc" }, { methodName: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.methodCode,
    method: row.methodName,
    description: row.description ?? "—",
    status: toStatus(row.isActive),
    scope: row.tenantId ? "Tenant" : "Host",
  }));
}

export async function listAnalyzers(
  tenantId: string,
  branchId?: string,
): Promise<AnalyzerRow[]> {
  const rows = await prisma.analyzer.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      department: { select: { name: true } },
      branch: { select: { code: true } },
    },
    orderBy: { machineName: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.analyzerCode,
    name: row.machineName,
    model: row.model ?? "—",
    manufacturer: row.manufacturer ?? "—",
    department: row.department.name,
    branchCode: row.branch.code,
    interfaceType: row.interfaceType,
    machineCode: row.analyzerCode,
    lisMapping: row.protocol ?? "—",
    communicationType: row.interfaceType,
    status: toStatus(row.isActive),
  }));
}

export async function listDoctors(tenantId: string): Promise<DoctorRow[]> {
  const rows = await prisma.doctor.findMany({
    where: { tenantId, isActive: true },
    include: {
      department: { select: { name: true } },
      doctorBranches: {
        where: { isActive: true },
        include: { branch: { select: { code: true } } },
      },
    },
    orderBy: { doctorName: "asc" },
  });

  return rows.map((row) => {
    const doctorTypes: string[] = [];
    if (row.isReferring) doctorTypes.push("Referring");
    if (row.isReporting) doctorTypes.push("Reporting");
    if (row.isVerifying) doctorTypes.push("Verifying");
    if (row.isConsultant) doctorTypes.push("Consultant");
    if (row.isPathologist) doctorTypes.push("Pathologist");
    if (row.isRadiologist) doctorTypes.push("Radiologist");

    return {
      id: row.id,
      code: row.doctorCode,
      name: row.doctorName,
      degree: row.degree ?? "—",
      specialty: row.specialty ?? "—",
      phone: row.phone ?? "—",
      department: row.department?.name ?? "—",
      doctorTypes,
      branches: row.doctorBranches.map((b) => b.branch.code),
      status: toStatus(row.isActive),
    };
  });
}

export async function listReportDoctorAssignments(
  tenantId: string,
  branchId?: string,
): Promise<ReportDoctorAssignmentRow[]> {
  const rows = await prisma.reportDoctorAssignment.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
    },
    include: {
      tenantService: {
        select: {
          localName: true,
          hostService: { select: { serviceCode: true } },
        },
      },
      department: { select: { name: true } },
      reportingDoctor: { select: { doctorName: true } },
      verifyingDoctor: { select: { doctorName: true } },
      consultantDoctor: { select: { doctorName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    serviceCode:
      row.tenantService?.hostService?.serviceCode ??
      row.tenantService?.localName ??
      "—",
    serviceName: row.tenantService?.localName ?? "Department default",
    department: row.department.name,
    reportingDoctor: row.reportingDoctor?.doctorName ?? "—",
    verifyingDoctor: row.verifyingDoctor?.doctorName ?? "—",
    consultant: row.consultantDoctor?.doctorName ?? "—",
    isDefault: row.defaultForReport,
  }));
}

export async function listSignatureTemplates(
  tenantId: string,
  branchId?: string,
): Promise<SignatureTemplateRow[]> {
  const rows = await prisma.reportSignatureTemplate.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
    },
    include: {
      doctor: { select: { doctorName: true } },
      department: { select: { name: true } },
      branch: { select: { code: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: `${row.doctor.doctorName} — ${row.department?.name ?? "All departments"}`,
    doctorName: row.doctor.doctorName,
    department: row.department?.name ?? "All",
    branchCode: row.branch?.code ?? null,
    signatureImage: "—",
    sealImage: "—",
    showDegree: row.showDegree,
    showBmdc: row.showBmdc,
    showSeal: row.showSeal,
    showQr: false,
    position: mapSignaturePosition(row.signaturePosition),
    footerText: row.footerText ?? "",
  }));
}

export async function listModuleRegistry(): Promise<ModuleRegistryRow[]> {
  const rows = await prisma.moduleRegistry.findMany({
    where: { isActive: true },
    orderBy: [{ moduleGroup: "asc" }, { moduleCode: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    moduleCode: row.moduleCode,
    moduleName: row.moduleName,
    moduleGroup: row.moduleGroup,
    description: row.description ?? "",
    coreModule: row.isCore,
    status: toStatus(row.isActive),
  }));
}

export async function listTenantBranches(tenantId: string): Promise<BranchOption[]> {
  const branches = await prisma.branch.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  return branches;
}

export async function listTenantDepartments(
  tenantId: string,
): Promise<{ id: string; name: string }[]> {
  const departments = await prisma.department.findMany({
    where: {
      isActive: true,
      OR: [{ tenantId: null }, { tenantId }],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return departments;
}
