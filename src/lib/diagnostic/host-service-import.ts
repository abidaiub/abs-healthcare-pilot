import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import {
  HOST_SERVICES,
  HOST_TEST_METHOD_REFERENCES,
} from "../../../prisma/seed/data/host-diagnostic-catalog-data";

export type ImportHostServicesInput = {
  tenantId: string;
  hostServiceIds: string[];
  branchIds?: string[];
  assignAllBranches?: boolean;
  createdBy?: string;
};

export type ImportHostServiceResult = {
  hostServiceId: string;
  serviceCode: string;
  status: "imported" | "skipped" | "failed";
  tenantServiceId?: string;
  message?: string;
};

export type ImportHostServicesOutput = {
  tenantId: string;
  results: ImportHostServiceResult[];
  importedCount: number;
  skippedCount: number;
  failedCount: number;
};

type DbClient = PrismaClient | Prisma.TransactionClient;

export class HostServiceImportError extends Error {
  constructor(
    message: string,
    readonly code: "TENANT_NOT_FOUND" | "HOST_SERVICE_NOT_FOUND" | "BRANCH_NOT_FOUND" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "HostServiceImportError";
  }
}

async function resolveTenantBranches(
  db: DbClient,
  tenantId: string,
  branchIds: string[] | undefined,
  assignAllBranches: boolean | undefined,
) {
  if (branchIds?.length) {
    const branches = await db.branch.findMany({
      where: {
        tenantId,
        id: { in: branchIds },
        isActive: true,
      },
      select: { id: true, code: true },
    });

    if (branches.length !== branchIds.length) {
      throw new HostServiceImportError(
        "One or more branches were not found for this tenant.",
        "BRANCH_NOT_FOUND",
      );
    }

    return branches;
  }

  if (assignAllBranches) {
    return db.branch.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, code: true },
    });
  }

  return [];
}

async function ensureTenantTestMethod(
  db: DbClient,
  tenantId: string,
  methodCode: string | undefined,
  departmentId: string | null | undefined,
  createdBy?: string,
): Promise<string | null> {
  if (!methodCode) return null;

  const reference = HOST_TEST_METHOD_REFERENCES.find((m) => m.methodCode === methodCode);
  if (!reference) return null;

  const deptId =
    reference.deptCode && departmentId
      ? departmentId
      : departmentId ?? null;

  const existing = await db.testMethod.findFirst({
    where: {
      tenantId,
      branchId: null,
      methodCode: reference.methodCode,
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await db.testMethod.create({
    data: {
      tenantId,
      branchId: null,
      departmentId: deptId,
      methodCode: reference.methodCode,
      methodName: reference.methodName,
      createdBy,
    },
  });

  return created.id;
}

async function ensureTenantReportingMethod(
  db: DbClient,
  tenantId: string,
  hostReportingMethodId: string | null | undefined,
  createdBy?: string,
): Promise<string | null> {
  if (!hostReportingMethodId) return null;

  const hostMethod = await db.reportingMethod.findUnique({
    where: { id: hostReportingMethodId },
  });

  if (!hostMethod) return null;

  if (hostMethod.tenantId === null) {
    return hostMethod.id;
  }

  const tenantMethod = await db.reportingMethod.findFirst({
    where: {
      tenantId,
      methodCode: hostMethod.methodCode,
    },
    select: { id: true },
  });

  if (tenantMethod) return tenantMethod.id;

  const created = await db.reportingMethod.create({
    data: {
      tenantId,
      methodCode: hostMethod.methodCode,
      methodName: hostMethod.methodName,
      description: hostMethod.description,
      createdBy,
    },
  });

  return created.id;
}

async function importSingleHostService(
  db: DbClient,
  input: {
    tenantId: string;
    hostServiceId: string;
    branchIds: string[];
    createdBy?: string;
  },
): Promise<ImportHostServiceResult> {
  const hostService = await db.hostService.findUnique({
    where: { id: input.hostServiceId },
    include: {
      parameters: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
      sampleRequirements: { where: { isActive: true }, take: 1 },
    },
  });

  if (!hostService) {
    return {
      hostServiceId: input.hostServiceId,
      serviceCode: "UNKNOWN",
      status: "failed",
      message: "Host service not found.",
    };
  }

  const existing = await db.tenantService.findFirst({
    where: {
      tenantId: input.tenantId,
      hostServiceId: hostService.id,
      isActive: true,
    },
    select: { id: true },
  });

  if (existing) {
    return {
      hostServiceId: hostService.id,
      serviceCode: hostService.serviceCode,
      status: "skipped",
      tenantServiceId: existing.id,
      message: "Already imported for this tenant.",
    };
  }

  const sampleRequirement = hostService.sampleRequirements[0];
  const seedMeta = HOST_SERVICES.find((s) => s.serviceCode === hostService.serviceCode);

  const testMethodId = await ensureTenantTestMethod(
    db,
    input.tenantId,
    seedMeta?.testMethodCode,
    hostService.departmentId,
    input.createdBy,
  );

  const reportingMethodId = await ensureTenantReportingMethod(
    db,
    input.tenantId,
    sampleRequirement?.reportingMethodId,
    input.createdBy,
  );

  const tenantService = await db.tenantService.create({
    data: {
      tenantId: input.tenantId,
      hostServiceId: hostService.id,
      localName: hostService.serviceName,
      departmentId: hostService.departmentId,
      categoryId: hostService.categoryId,
      sampleTypeId: sampleRequirement?.sampleTypeId ?? null,
      sampleContainerId: sampleRequirement?.sampleContainerId ?? null,
      price: hostService.basePrice,
      discountAllowed: true,
      effectiveFrom: new Date(),
      testMethodId,
      reportingMethodId,
      analyzerId: null,
      isBarcodeRequired: hostService.isBarcodeRequired,
      tatHours: null,
      createdBy: input.createdBy,
      serviceParameters: {
        create: hostService.parameters.map((param) => ({
          tenantId: input.tenantId,
          parameterCode: param.parameterCode,
          parameterName: param.parameterName,
          unit: param.unit,
          resultType: param.resultType,
          displayOrder: param.displayOrder,
          createdBy: input.createdBy,
        })),
      },
    },
  });

  if (input.branchIds.length > 0) {
    for (const branchId of input.branchIds) {
      await db.tenantServiceBranch.upsert({
        where: {
          tenantId_branchId_tenantServiceId: {
            tenantId: input.tenantId,
            branchId,
            tenantServiceId: tenantService.id,
          },
        },
        update: {
          isAvailable: true,
          isActive: true,
          branchPrice: hostService.basePrice,
          updatedBy: input.createdBy,
        },
        create: {
          tenantId: input.tenantId,
          branchId,
          tenantServiceId: tenantService.id,
          isAvailable: true,
          branchPrice: hostService.basePrice,
          branchDiscountAllowed: true,
          createdBy: input.createdBy,
        },
      });
    }
  }

  return {
    hostServiceId: hostService.id,
    serviceCode: hostService.serviceCode,
    status: "imported",
    tenantServiceId: tenantService.id,
  };
}

export async function importHostServicesToTenant(
  prisma: PrismaClient,
  input: ImportHostServicesInput,
): Promise<ImportHostServicesOutput> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { id: true, isActive: true },
  });

  if (!tenant?.isActive) {
    throw new HostServiceImportError("Tenant not found or inactive.", "TENANT_NOT_FOUND");
  }

  const branches = await resolveTenantBranches(
    prisma,
    input.tenantId,
    input.branchIds,
    input.assignAllBranches,
  );

  const branchIds = branches.map((b) => b.id);
  const results: ImportHostServiceResult[] = [];

  await prisma.$transaction(async (tx) => {
    for (const hostServiceId of input.hostServiceIds) {
      const result = await importSingleHostService(tx, {
        tenantId: input.tenantId,
        hostServiceId,
        branchIds,
        createdBy: input.createdBy,
      });
      results.push(result);
    }
  });

  return {
    tenantId: input.tenantId,
    results,
    importedCount: results.filter((r) => r.status === "imported").length,
    skippedCount: results.filter((r) => r.status === "skipped").length,
    failedCount: results.filter((r) => r.status === "failed").length,
  };
}

export async function importHostServicesByCode(
  prisma: PrismaClient,
  input: Omit<ImportHostServicesInput, "hostServiceIds"> & { serviceCodes: string[] },
): Promise<ImportHostServicesOutput> {
  const hostServices = await prisma.hostService.findMany({
    where: {
      serviceCode: { in: input.serviceCodes },
      isActive: true,
    },
    select: { id: true },
  });

  if (hostServices.length === 0) {
    throw new HostServiceImportError("No matching host services found.", "HOST_SERVICE_NOT_FOUND");
  }

  return importHostServicesToTenant(prisma, {
    tenantId: input.tenantId,
    hostServiceIds: hostServices.map((s) => s.id),
    branchIds: input.branchIds,
    assignAllBranches: input.assignAllBranches,
    createdBy: input.createdBy,
  });
}
