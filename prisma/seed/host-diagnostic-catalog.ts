import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  HOST_CATEGORIES,
  HOST_DEPARTMENTS,
  HOST_REPORTING_METHODS,
  HOST_SAMPLE_CONTAINERS,
  HOST_SAMPLE_TYPES,
  HOST_SERVICES,
  HOST_TEST_METHOD_REFERENCES,
} from "./data/host-diagnostic-catalog-data";

type IdMaps = {
  departments: Map<string, string>;
  categories: Map<string, string>;
  sampleTypes: Map<string, string>;
  sampleContainers: Map<string, string>;
  reportingMethods: Map<string, string>;
  hostServices: Map<string, string>;
};

async function upsertHostDepartment(
  prisma: PrismaClient,
  deptCode: string,
  data: { name: string; deptType: string },
) {
  const existing = await prisma.department.findFirst({
    where: { tenantId: null, deptCode },
    select: { id: true },
  });

  if (existing) {
    return prisma.department.update({
      where: { id: existing.id },
      data: { ...data, isActive: true },
    });
  }

  return prisma.department.create({
    data: { tenantId: null, deptCode, ...data },
  });
}

async function upsertHostCategory(
  prisma: PrismaClient,
  departmentId: string,
  categoryCode: string,
  data: { name: string; categoryType: string },
) {
  const existing = await prisma.category.findFirst({
    where: { tenantId: null, departmentId, categoryCode },
    select: { id: true },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { ...data, isActive: true },
    });
  }

  return prisma.category.create({
    data: { tenantId: null, departmentId, categoryCode, ...data },
  });
}

async function upsertHostSampleType(
  prisma: PrismaClient,
  typeCode: string,
  sampleType: string,
) {
  const existing = await prisma.sampleType.findFirst({
    where: { tenantId: null, typeCode },
    select: { id: true },
  });

  if (existing) {
    return prisma.sampleType.update({
      where: { id: existing.id },
      data: { sampleType, isActive: true },
    });
  }

  return prisma.sampleType.create({
    data: { tenantId: null, typeCode, sampleType },
  });
}

async function upsertHostSampleContainer(
  prisma: PrismaClient,
  containerCode: string,
  data: {
    containerType: string;
    tubeColor: string;
    departmentId?: string | null;
    collectionInstruction?: string | null;
    barcodeRequired?: boolean;
    sampleRequired?: boolean;
    volumeMl?: number | null;
  },
) {
  const existing = await prisma.sampleContainer.findFirst({
    where: { tenantId: null, containerCode },
    select: { id: true },
  });

  if (existing) {
    return prisma.sampleContainer.update({
      where: { id: existing.id },
      data: { ...data, isActive: true },
    });
  }

  return prisma.sampleContainer.create({
    data: { tenantId: null, containerCode, ...data },
  });
}

async function upsertHostReportingMethod(
  prisma: PrismaClient,
  methodCode: string,
  data: { methodName: string; description?: string | null },
) {
  const existing = await prisma.reportingMethod.findFirst({
    where: { tenantId: null, methodCode },
    select: { id: true },
  });

  if (existing) {
    return prisma.reportingMethod.update({
      where: { id: existing.id },
      data: { ...data, isActive: true },
    });
  }

  return prisma.reportingMethod.create({
    data: { tenantId: null, methodCode, ...data },
  });
}

async function upsertTenantTestMethod(
  prisma: PrismaClient,
  tenantId: string,
  methodCode: string,
  data: { methodName: string; departmentId?: string | null },
) {
  const existing = await prisma.testMethod.findFirst({
    where: { tenantId, branchId: null, methodCode },
    select: { id: true },
  });

  if (existing) {
    return prisma.testMethod.update({
      where: { id: existing.id },
      data: { ...data, isActive: true },
    });
  }

  return prisma.testMethod.create({
    data: { tenantId, branchId: null, methodCode, ...data },
  });
}

/**
 * Idempotent host diagnostic catalog seed.
 * Uses upsert on natural keys — does not delete or overwrite tenant-owned rows.
 */
export async function seedHostDiagnosticCatalog(prisma: PrismaClient): Promise<void> {
  const maps: IdMaps = {
    departments: new Map(),
    categories: new Map(),
    sampleTypes: new Map(),
    sampleContainers: new Map(),
    reportingMethods: new Map(),
    hostServices: new Map(),
  };

  for (const dept of HOST_DEPARTMENTS) {
    const row = await upsertHostDepartment(prisma, dept.deptCode, {
      name: dept.name,
      deptType: dept.deptType,
    });
    maps.departments.set(dept.deptCode, row.id);
  }

  for (const category of HOST_CATEGORIES) {
    const departmentId = maps.departments.get(category.deptCode);
    if (!departmentId) continue;

    const key = `${category.deptCode}:${category.categoryCode}`;
    const row = await upsertHostCategory(prisma, departmentId, category.categoryCode, {
      name: category.name,
      categoryType: category.categoryType,
    });
    maps.categories.set(key, row.id);
  }

  for (const sampleType of HOST_SAMPLE_TYPES) {
    const row = await upsertHostSampleType(prisma, sampleType.typeCode, sampleType.sampleType);
    maps.sampleTypes.set(sampleType.typeCode, row.id);
  }

  for (const container of HOST_SAMPLE_CONTAINERS) {
    const departmentId = container.deptCode
      ? maps.departments.get(container.deptCode)
      : undefined;

    const row = await upsertHostSampleContainer(prisma, container.containerCode, {
      containerType: container.containerType,
      tubeColor: container.tubeColor,
      departmentId: departmentId ?? null,
      collectionInstruction: container.collectionInstruction ?? null,
      barcodeRequired: container.barcodeRequired ?? true,
      sampleRequired: container.sampleRequired ?? true,
      volumeMl: container.volumeMl ?? null,
    });
    maps.sampleContainers.set(container.containerCode, row.id);
  }

  for (const method of HOST_REPORTING_METHODS) {
    const row = await upsertHostReportingMethod(prisma, method.methodCode, {
      methodName: method.methodName,
      description: method.description ?? null,
    });
    maps.reportingMethods.set(method.methodCode, row.id);
  }

  for (const service of HOST_SERVICES) {
    const departmentId = maps.departments.get(service.deptCode);
    const categoryId = maps.categories.get(`${service.deptCode}:${service.categoryCode}`);
    if (!departmentId || !categoryId) continue;

    const hostService = await prisma.hostService.upsert({
      where: { serviceCode: service.serviceCode },
      update: {
        serviceName: service.serviceName,
        shortName: service.shortName ?? service.serviceCode,
        departmentId,
        categoryId,
        isSampleRequired: service.isSampleRequired ?? true,
        isBarcodeRequired: service.isBarcodeRequired ?? true,
        isLabTest: service.isLabTest ?? service.deptCode === "LAB",
        resultMode: service.resultMode,
        basePrice: service.basePrice,
        isActive: true,
      },
      create: {
        serviceCode: service.serviceCode,
        serviceName: service.serviceName,
        shortName: service.shortName ?? service.serviceCode,
        departmentId,
        categoryId,
        isSampleRequired: service.isSampleRequired ?? true,
        isBarcodeRequired: service.isBarcodeRequired ?? true,
        isLabTest: service.isLabTest ?? service.deptCode === "LAB",
        resultMode: service.resultMode,
        basePrice: service.basePrice,
      },
    });
    maps.hostServices.set(service.serviceCode, hostService.id);

    if (service.parameters?.length) {
      for (const param of service.parameters) {
        await prisma.hostServiceParameter.upsert({
          where: {
            hostServiceId_parameterCode: {
              hostServiceId: hostService.id,
              parameterCode: param.parameterCode,
            },
          },
          update: {
            parameterName: param.parameterName,
            unit: param.unit ?? null,
            resultType: param.resultType,
            displayOrder: param.displayOrder,
            isRequired: param.isRequired ?? false,
            isActive: true,
          },
          create: {
            hostServiceId: hostService.id,
            parameterCode: param.parameterCode,
            parameterName: param.parameterName,
            unit: param.unit ?? null,
            resultType: param.resultType,
            displayOrder: param.displayOrder,
            isRequired: param.isRequired ?? false,
          },
        });
      }
    }

    const sampleTypeId = service.sampleTypeCode
      ? maps.sampleTypes.get(service.sampleTypeCode)
      : undefined;
    const sampleContainerId = service.containerCode
      ? maps.sampleContainers.get(service.containerCode)
      : undefined;

    const existingRequirement = await prisma.hostServiceSampleRequirement.findFirst({
      where: { hostServiceId: hostService.id, isActive: true },
      select: { id: true },
    });

    const requirementData = {
      sampleTypeId: sampleTypeId ?? null,
      sampleContainerId: sampleContainerId ?? null,
      testMethodId: null,
      reportingMethodId: service.reportingMethodCode
        ? maps.reportingMethods.get(service.reportingMethodCode) ?? null
        : null,
      analyzerId: null,
      specimenInstruction: service.specimenInstruction ?? null,
      fastingRequired: service.fastingRequired ?? false,
      isActive: true,
    };

    if (existingRequirement) {
      await prisma.hostServiceSampleRequirement.update({
        where: { id: existingRequirement.id },
        data: requirementData,
      });
    } else {
      await prisma.hostServiceSampleRequirement.create({
        data: {
          hostServiceId: hostService.id,
          ...requirementData,
        },
      });
    }
  }

  console.log(
    `Host diagnostic catalog seeded: ${maps.departments.size} departments, ${maps.categories.size} categories, ${maps.hostServices.size} host services`,
  );
}

/**
 * Seeds tenant-scoped reference test methods (TestMethod requires tenantId).
 * Safe to run after tenant upsert — idempotent by tenantId + methodCode.
 */
export async function seedTenantReferenceTestMethods(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  const departments = await prisma.department.findMany({
    where: { tenantId: null },
    select: { id: true, deptCode: true },
  });
  const deptByCode = new Map(departments.map((d) => [d.deptCode, d.id]));

  for (const method of HOST_TEST_METHOD_REFERENCES) {
    const departmentId = method.deptCode ? deptByCode.get(method.deptCode) : undefined;

    await upsertTenantTestMethod(prisma, tenantId, method.methodCode, {
      methodName: method.methodName,
      departmentId: departmentId ?? null,
    });
  }

  console.log(
    `Tenant reference test methods seeded for tenant ${tenantId}: ${HOST_TEST_METHOD_REFERENCES.length} methods`,
  );
}
