import type { PrismaClient } from "../../src/generated/prisma/client";
import { MODULE_REGISTRY } from "../../src/lib/saas-foundation-data";

export async function seedModuleRegistry(prisma: PrismaClient) {
  for (const mod of MODULE_REGISTRY) {
    await prisma.moduleRegistry.upsert({
      where: { moduleCode: mod.moduleCode },
      update: {
        moduleName: mod.moduleName,
        moduleGroup: mod.moduleGroup,
        description: mod.description,
        isCore: mod.coreModule,
        isActive: mod.status === "Active",
      },
      create: {
        moduleCode: mod.moduleCode,
        moduleName: mod.moduleName,
        moduleGroup: mod.moduleGroup,
        description: mod.description,
        isCore: mod.coreModule,
        isActive: mod.status === "Active",
      },
    });
  }
}

export async function seedTenantDiagnosticMasters(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
) {
  const labDept = await prisma.department.findFirst({
    where: { tenantId: null, deptCode: "LAB" },
    select: { id: true },
  });
  const radDept = await prisma.department.findFirst({
    where: { tenantId: null, deptCode: "RAD" },
    select: { id: true },
  });

  if (!labDept || !radDept) return;

  const reportingDoctor = await prisma.doctor.upsert({
    where: { tenantId_doctorCode: { tenantId, doctorCode: "DR-MK-001" } },
    update: {},
    create: {
      tenantId,
      doctorCode: "DR-MK-001",
      doctorName: "Dr. Mahmuda Khatun",
      degree: "MBBS, MPhil (Pathology)",
      specialty: "Pathology",
      phone: "+880 17 1111 2222",
      departmentId: labDept.id,
      isReporting: true,
      isVerifying: true,
      isPathologist: true,
      bmdcNo: "12345",
      doctorBranches: {
        create: { tenantId, branchId, isPrimary: true },
      },
      doctorDepartmentMappings: {
        create: {
          tenantId,
          departmentId: labDept.id,
          canReport: true,
          canVerify: true,
          canRelease: true,
        },
      },
    },
  });

  const radiologist = await prisma.doctor.upsert({
    where: { tenantId_doctorCode: { tenantId, doctorCode: "DR-SR-002" } },
    update: {},
    create: {
      tenantId,
      doctorCode: "DR-SR-002",
      doctorName: "Dr. Sayed Rahman",
      degree: "MBBS, MD (Radiology)",
      specialty: "Radiology",
      phone: "+880 17 3333 4444",
      departmentId: radDept.id,
      isReporting: true,
      isRadiologist: true,
      doctorBranches: {
        create: { tenantId, branchId, isPrimary: true },
      },
    },
  });

  await prisma.analyzer.upsert({
    where: {
      tenantId_branchId_analyzerCode: {
        tenantId,
        branchId,
        analyzerCode: "SYSMEX-XN1000",
      },
    },
    update: {},
    create: {
      tenantId,
      branchId,
      departmentId: labDept.id,
      analyzerCode: "SYSMEX-XN1000",
      machineName: "Sysmex XN-1000",
      model: "XN-1000",
      manufacturer: "Sysmex",
      interfaceType: "HL7",
      protocol: "LIS-SYSMEX-01",
    },
  });

  await prisma.analyzer.upsert({
    where: {
      tenantId_branchId_analyzerCode: {
        tenantId,
        branchId,
        analyzerCode: "COBAS-E411",
      },
    },
    update: {},
    create: {
      tenantId,
      branchId,
      departmentId: labDept.id,
      analyzerCode: "COBAS-E411",
      machineName: "Cobas e411",
      model: "e411",
      manufacturer: "Roche",
      interfaceType: "ASTM",
      protocol: "LIS-COBAS-01",
    },
  });

  await prisma.reportSignatureTemplate.upsert({
    where: { id: "seed-sig-template-abmg" },
    update: {},
    create: {
      id: "seed-sig-template-abmg",
      tenantId,
      branchId,
      departmentId: labDept.id,
      doctorId: reportingDoctor.id,
      signaturePosition: "Right",
      showDegree: true,
      showBmdc: true,
      showSeal: true,
      footerText: "This is a computer-generated report.",
    },
  });

  const cbcService = await prisma.tenantService.findFirst({
    where: {
      tenantId,
      hostService: { serviceCode: "CBC" },
    },
    select: { id: true },
  });

  if (cbcService) {
    await prisma.reportDoctorAssignment.upsert({
      where: { id: "seed-report-doc-cbc" },
      update: {},
      create: {
        id: "seed-report-doc-cbc",
        tenantId,
        branchId,
        tenantServiceId: cbcService.id,
        departmentId: labDept.id,
        reportingDoctorId: reportingDoctor.id,
        verifyingDoctorId: reportingDoctor.id,
        defaultForReport: true,
        effectiveFrom: new Date(),
      },
    });
  }

  const xrayService = await prisma.tenantService.findFirst({
    where: {
      tenantId,
      hostService: { serviceCode: "XRCHEST" },
    },
    select: { id: true },
  });

  if (xrayService) {
    await prisma.reportDoctorAssignment.upsert({
      where: { id: "seed-report-doc-xray" },
      update: {},
      create: {
        id: "seed-report-doc-xray",
        tenantId,
        branchId,
        tenantServiceId: xrayService.id,
        departmentId: radDept.id,
        reportingDoctorId: radiologist.id,
        defaultForReport: true,
        effectiveFrom: new Date(),
      },
    });
  }
}
