import { prisma } from "@/lib/db";
import { evaluateOperationalReadiness } from "@/lib/operational-readiness/evaluate";
import type { OperationalReadinessReport } from "@/lib/operational-readiness/types";

export async function loadOperationalReadiness(
  tenantId: string,
): Promise<OperationalReadinessReport> {
  const [
    tenant,
    branchCount,
    departments,
    users,
    doctors,
    services,
    referenceRanges,
    analyzers,
    portalSettings,
    notificationTemplateCount,
  ] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        tenantName: true,
        contactMobile: true,
        contactEmail: true,
        address: true,
        website: true,
        logoUrl: true,
        reportHeaderLogoUrl: true,
        reportFooterText: true,
        invoiceFooterText: true,
        headerBrandingText: true,
        footerBrandingText: true,
        readyForFirstPatientAt: true,
        readyForFirstPatientById: true,
      },
    }),
    prisma.branch.count({ where: { tenantId, isActive: true } }),
    prisma.department.findMany({
      where: {
        isActive: true,
        OR: [{ tenantId }, { tenantId: null }],
      },
      select: { deptCode: true, name: true, isActive: true },
    }),
    prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: {
        isActive: true,
        userStatus: true,
        userRoles: {
          where: { isActive: true },
          select: {
            role: { select: { roleName: true, roleCode: true } },
          },
        },
      },
    }),
    prisma.doctor.findMany({
      where: { tenantId },
      select: {
        isActive: true,
        isVerifying: true,
        isPathologist: true,
        doctorSchedules: {
          where: { isActive: true, isPublished: true },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.tenantService.findMany({
      where: { tenantId },
      select: {
        isActive: true,
        price: true,
        departmentId: true,
        sampleTypeId: true,
        sampleContainerId: true,
        id: true,
        serviceParameters: {
          where: { isActive: true },
          select: {
            referenceRanges: {
              where: { isActive: true },
              select: { id: true },
              take: 1,
            },
          },
        },
        analyzerMappings: {
          where: { isActive: true },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.serviceParameterReferenceRange.findMany({
      where: { tenantId, isActive: true },
      select: {
        gender: true,
        ageFromDays: true,
        ageToDays: true,
        unit: true,
        normalLow: true,
        normalHigh: true,
        criticalLow: true,
        criticalHigh: true,
        textRange: true,
      },
    }),
    prisma.analyzer.findMany({
      where: { tenantId },
      select: {
        isActive: true,
        lisConnectionStatus: true,
        lisEndpoint: true,
        lisLastCommunicationAt: true,
        mappings: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    }),
    prisma.tenantPortalSettings.findUnique({ where: { tenantId } }),
    prisma.notificationTemplate.count({ where: { tenantId, isActive: true } }),
  ]);

  let readyDeclaredByName: string | null = null;
  if (tenant.readyForFirstPatientById) {
    const actor = await prisma.user.findUnique({
      where: { id: tenant.readyForFirstPatientById },
      select: { username: true },
    });
    readyDeclaredByName = actor?.username ?? null;
  }

  return evaluateOperationalReadiness({
    tenant,
    branchCount,
    departments,
    users: users.map((u) => ({
      isActive: u.isActive,
      userStatus: u.userStatus,
      roleNames: u.userRoles.map((r) => r.role.roleName),
      roleCodes: u.userRoles.map((r) => r.role.roleCode),
    })),
    doctors: doctors.map((d) => ({
      isActive: d.isActive,
      isVerifying: d.isVerifying,
      isPathologist: d.isPathologist,
      hasPublishedSchedule: d.doctorSchedules.length > 0,
    })),
    services: services.map((s) => ({
      isActive: s.isActive,
      price: Number(s.price),
      hasDepartment: Boolean(s.departmentId),
      hasSampleType: Boolean(s.sampleTypeId),
      hasContainer: Boolean(s.sampleContainerId),
      hasAnalyzerMapping: s.analyzerMappings.length > 0,
      hasReferenceRange: s.serviceParameters.some(
        (p) => p.referenceRanges.length > 0,
      ),
    })),
    referenceRanges: referenceRanges.map((r) => ({
      gender: r.gender,
      ageFromDays: r.ageFromDays,
      ageToDays: r.ageToDays,
      unit: r.unit,
      hasNormal:
        r.normalLow != null ||
        r.normalHigh != null ||
        Boolean(r.textRange?.trim()),
      hasCritical: r.criticalLow != null || r.criticalHigh != null,
    })),
    analyzers: analyzers.map((a) => ({
      isActive: a.isActive,
      mappingCount: a.mappings.length,
      lisConnectionStatus: a.lisConnectionStatus,
      lisEndpoint: a.lisEndpoint,
      lisLastCommunicationAt: a.lisLastCommunicationAt,
    })),
    portalSettings,
    notificationTemplateCount,
    readyDeclaredByName,
  });
}

export async function listTenantOwnedDepartments(tenantId: string) {
  return prisma.department.findMany({
    where: {
      OR: [{ tenantId }, { tenantId: null }],
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function getCompanyProfile(tenantId: string) {
  return prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      id: true,
      tenantCode: true,
      tenantName: true,
      legalName: true,
      address: true,
      city: true,
      district: true,
      contactMobile: true,
      contactEmail: true,
      website: true,
      logoUrl: true,
      reportHeaderLogoUrl: true,
      reportFooterText: true,
      invoiceFooterText: true,
      headerBrandingText: true,
      footerBrandingText: true,
      barcodePrefix: true,
      readyForFirstPatientAt: true,
      onboardingStatus: true,
    },
  });
}

export async function getOrInitPortalSettings(tenantId: string, actor: string) {
  const existing = await prisma.tenantPortalSettings.findUnique({
    where: { tenantId },
  });
  if (existing) return existing;

  return prisma.tenantPortalSettings.create({
    data: {
      tenantId,
      createdBy: actor,
      updatedBy: actor,
    },
  });
}

export async function listLisAnalyzers(tenantId: string, branchId?: string) {
  return prisma.analyzer.findMany({
    where: {
      tenantId,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      department: { select: { id: true, name: true, deptCode: true } },
      branch: { select: { id: true, code: true, name: true } },
      mappings: {
        where: { isActive: true },
        include: {
          tenantService: {
            select: { id: true, localName: true },
          },
        },
      },
    },
    orderBy: { machineName: "asc" },
  });
}

export async function listCatalogReadinessRows(tenantId: string) {
  const services = await prisma.tenantService.findMany({
    where: { tenantId },
    include: {
      department: { select: { name: true } },
      sampleType: { select: { sampleType: true } },
      sampleContainer: { select: { containerType: true } },
      analyzerMappings: {
        where: { isActive: true },
        select: { id: true },
      },
      serviceParameters: {
        where: { isActive: true },
        select: {
          id: true,
          referenceRanges: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { localName: "asc" },
  });

  return services.map((s) => {
    const missing: string[] = [];
    if (!s.departmentId) missing.push("Department");
    if (!(Number(s.price) > 0)) missing.push("Price");
    if (!s.sampleTypeId) missing.push("Sample type");
    if (!s.sampleContainerId) missing.push("Tube");
    if (s.analyzerMappings.length === 0) missing.push("Analyzer mapping");
    if (!s.serviceParameters.some((p) => p.referenceRanges.length > 0)) {
      missing.push("Reference range");
    }
    return {
      id: s.id,
      name: s.localName,
      department: s.department?.name ?? "—",
      price: Number(s.price),
      sampleType: s.sampleType?.sampleType ?? "—",
      tube: s.sampleContainer?.containerType ?? "—",
      analyzerMapping: s.analyzerMappings.length > 0,
      referenceRange: s.serviceParameters.some((p) => p.referenceRanges.length > 0),
      isActive: s.isActive,
      missing,
    };
  });
}

export async function listReferenceRangeReadinessRows(tenantId: string) {
  const rows = await prisma.serviceParameterReferenceRange.findMany({
    where: { tenantId, isActive: true },
    include: {
      serviceParameter: {
        select: {
          parameterCode: true,
          parameterName: true,
          unit: true,
          tenantService: { select: { localName: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    service: r.serviceParameter.tenantService.localName,
    parameter: r.serviceParameter.parameterName,
    parameterCode: r.serviceParameter.parameterCode,
    gender: r.gender ?? "—",
    ageFromDays: r.ageFromDays,
    ageToDays: r.ageToDays,
    unit: r.unit ?? r.serviceParameter.unit ?? "—",
    normalLow: r.normalLow != null ? Number(r.normalLow) : null,
    normalHigh: r.normalHigh != null ? Number(r.normalHigh) : null,
    criticalLow: r.criticalLow != null ? Number(r.criticalLow) : null,
    criticalHigh: r.criticalHigh != null ? Number(r.criticalHigh) : null,
    textRange: r.textRange,
  }));
}
