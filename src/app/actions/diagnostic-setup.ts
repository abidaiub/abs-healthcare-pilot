"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  listAnalyzers,
  listContainers,
  listDoctors,
  listHostCatalogServices,
  getHostCatalogKpis,
  listImportableHostServices,
  listModuleRegistry,
  listReportDoctorAssignments,
  listReportingMethods,
  listSampleTypes,
  listSignatureTemplates,
  listTenantBranches,
  listTenantImportedServices,
  listTenantOptions,
  listTenantServiceOptions,
  listTestMethods,
  listTestParameters,
} from "@/lib/diagnostic/queries";
import { getSession, requireHostSession, requireTenantSession } from "@/lib/auth";

export type DiagnosticQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function auditUser(): Promise<string | undefined> {
  const session = await getSession();
  return session?.user.name;
}

function revalidateTenantSetup() {
  revalidatePath("/settings", "layout");
}

// ── Host queries ─────────────────────────────────────────────────────────────

export async function fetchHostCatalogAction(): Promise<
  DiagnosticQueryResult<{
    services: Awaited<ReturnType<typeof listHostCatalogServices>>;
    kpis: Awaited<ReturnType<typeof getHostCatalogKpis>>;
    tenants: Awaited<ReturnType<typeof listTenantOptions>>;
  }>
> {
  try {
    await requireHostSession();
    const services = await listHostCatalogServices();
    const [kpis, tenants] = await Promise.all([
      getHostCatalogKpis(services),
      listTenantOptions(),
    ]);
    return { ok: true, data: { services, kpis, tenants } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load host catalog.",
    };
  }
}

export async function fetchModuleRegistryAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listModuleRegistry>>>
> {
  try {
    await requireHostSession();
    const data = await listModuleRegistry();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load module registry.",
    };
  }
}

// ── Tenant queries ───────────────────────────────────────────────────────────

export async function fetchImportableHostServicesAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listImportableHostServices>>>
> {
  try {
    const session = await requireTenantSession();
    const data = await listImportableHostServices(session.tenantId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load import catalog.",
    };
  }
}

export async function fetchTenantImportedServicesAction(): Promise<
  DiagnosticQueryResult<{
    services: Awaited<ReturnType<typeof listTenantImportedServices>>;
    branches: Awaited<ReturnType<typeof listTenantBranches>>;
  }>
> {
  try {
    const session = await requireTenantSession();
    const [services, branches] = await Promise.all([
      listTenantImportedServices(session.tenantId),
      listTenantBranches(session.tenantId),
    ]);
    return { ok: true, data: { services, branches } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load imported services.",
    };
  }
}

export async function fetchTestParametersAction(
  tenantServiceId?: string,
): Promise<
  DiagnosticQueryResult<{
    parameters: Awaited<ReturnType<typeof listTestParameters>>;
    services: Awaited<ReturnType<typeof listTenantServiceOptions>>;
  }>
> {
  try {
    const session = await requireTenantSession();
    const [parameters, services] = await Promise.all([
      listTestParameters(session.tenantId, tenantServiceId),
      listTenantServiceOptions(session.tenantId),
    ]);
    return { ok: true, data: { parameters, services } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load test parameters.",
    };
  }
}

export async function fetchSampleTypesAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listSampleTypes>>>
> {
  try {
    const session = await requireTenantSession();
    const data = await listSampleTypes(session.tenantId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load sample types.",
    };
  }
}

export async function fetchContainersAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listContainers>>>
> {
  try {
    const session = await requireTenantSession();
    const data = await listContainers(session.tenantId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load containers.",
    };
  }
}

export async function fetchTestMethodsAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listTestMethods>>>
> {
  try {
    const session = await requireTenantSession();
    const data = await listTestMethods(session.tenantId, session.branchId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load test methods.",
    };
  }
}

export async function fetchReportingMethodsAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listReportingMethods>>>
> {
  try {
    const session = await requireTenantSession();
    const data = await listReportingMethods(session.tenantId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load reporting methods.",
    };
  }
}

export async function fetchAnalyzersAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listAnalyzers>>>
> {
  try {
    const session = await requireTenantSession();
    const data = await listAnalyzers(session.tenantId, session.branchId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load analyzers.",
    };
  }
}

export async function fetchDoctorsAction(): Promise<
  DiagnosticQueryResult<{
    doctors: Awaited<ReturnType<typeof listDoctors>>;
    branches: Awaited<ReturnType<typeof listTenantBranches>>;
  }>
> {
  try {
    const session = await requireTenantSession();
    const [doctors, branches] = await Promise.all([
      listDoctors(session.tenantId),
      listTenantBranches(session.tenantId),
    ]);
    return { ok: true, data: { doctors, branches } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load doctors.",
    };
  }
}

export async function fetchReportDoctorAssignmentsAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listReportDoctorAssignments>>>
> {
  try {
    const session = await requireTenantSession();
    const data = await listReportDoctorAssignments(session.tenantId, session.branchId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load report doctor assignments.",
    };
  }
}

export async function fetchSignatureTemplatesAction(): Promise<
  DiagnosticQueryResult<Awaited<ReturnType<typeof listSignatureTemplates>>>
> {
  try {
    const session = await requireTenantSession();
    const data = await listSignatureTemplates(session.tenantId, session.branchId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load signature templates.",
    };
  }
}

// ── Tenant mutations ─────────────────────────────────────────────────────────

export async function createTenantSampleTypeAction(input: {
  typeCode: string;
  sampleType: string;
}): Promise<DiagnosticQueryResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const createdBy = await auditUser();

    const typeCode = input.typeCode.trim().toUpperCase();
    const sampleType = input.sampleType.trim();

    if (!typeCode || !sampleType) {
      return { ok: false, error: "Code and name are required." };
    }

    const existing = await prisma.sampleType.findFirst({
      where: { tenantId: session.tenantId, typeCode },
    });
    if (existing) {
      return { ok: false, error: "Sample type code already exists for this tenant." };
    }

    const created = await prisma.sampleType.create({
      data: {
        tenantId: session.tenantId,
        typeCode,
        sampleType,
        createdBy,
      },
    });

    revalidateTenantSetup();
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create sample type.",
    };
  }
}

export async function createTenantDoctorAction(input: {
  doctorCode: string;
  doctorName: string;
  degree?: string;
  specialty?: string;
  phone?: string;
  departmentId?: string;
  isReporting?: boolean;
  isVerifying?: boolean;
  isPathologist?: boolean;
}): Promise<DiagnosticQueryResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const createdBy = await auditUser();

    const doctorCode = input.doctorCode.trim().toUpperCase();
    const doctorName = input.doctorName.trim();

    if (!doctorCode || !doctorName) {
      return { ok: false, error: "Doctor code and name are required." };
    }

    const existing = await prisma.doctor.findFirst({
      where: { tenantId: session.tenantId, doctorCode },
    });
    if (existing) {
      return { ok: false, error: "Doctor code already exists for this tenant." };
    }

    const created = await prisma.doctor.create({
      data: {
        tenantId: session.tenantId,
        doctorCode,
        doctorName,
        degree: input.degree?.trim() || null,
        specialty: input.specialty?.trim() || null,
        phone: input.phone?.trim() || null,
        departmentId: input.departmentId || null,
        isReporting: input.isReporting ?? false,
        isVerifying: input.isVerifying ?? false,
        isPathologist: input.isPathologist ?? false,
        createdBy,
        doctorBranches: {
          create: {
            tenantId: session.tenantId,
            branchId: session.branchId,
            isPrimary: true,
            createdBy,
          },
        },
      },
    });

    revalidateTenantSetup();
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create doctor.",
    };
  }
}

export async function createTenantAnalyzerAction(input: {
  analyzerCode: string;
  machineName: string;
  departmentId: string;
  interfaceType: string;
  model?: string;
  manufacturer?: string;
}): Promise<DiagnosticQueryResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const createdBy = await auditUser();

    const analyzerCode = input.analyzerCode.trim().toUpperCase();
    const machineName = input.machineName.trim();

    if (!analyzerCode || !machineName || !input.departmentId) {
      return { ok: false, error: "Code, name, and department are required." };
    }

    const existing = await prisma.analyzer.findFirst({
      where: {
        tenantId: session.tenantId,
        branchId: session.branchId,
        analyzerCode,
      },
    });
    if (existing) {
      return { ok: false, error: "Analyzer code already exists for this branch." };
    }

    const created = await prisma.analyzer.create({
      data: {
        tenantId: session.tenantId,
        branchId: session.branchId,
        departmentId: input.departmentId,
        analyzerCode,
        machineName,
        interfaceType: input.interfaceType.trim() || "Manual",
        model: input.model?.trim() || null,
        manufacturer: input.manufacturer?.trim() || null,
        createdBy,
      },
    });

    revalidateTenantSetup();
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create analyzer.",
    };
  }
}

export async function updateTenantServiceAction(input: {
  tenantServiceId: string;
  price?: number;
  tatHours?: number | null;
  isActive?: boolean;
}): Promise<DiagnosticQueryResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const updatedBy = await auditUser();

    const existing = await prisma.tenantService.findFirst({
      where: { id: input.tenantServiceId, tenantId: session.tenantId },
    });
    if (!existing) {
      return { ok: false, error: "Service not found for this tenant." };
    }

    if (input.price != null && input.price < 0) {
      return { ok: false, error: "Price cannot be negative." };
    }

    const updated = await prisma.tenantService.update({
      where: { id: input.tenantServiceId },
      data: {
        ...(input.price != null ? { price: input.price } : {}),
        ...(input.tatHours !== undefined ? { tatHours: input.tatHours } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedBy,
      },
    });

    revalidateTenantSetup();
    return { ok: true, data: { id: updated.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update service.",
    };
  }
}
