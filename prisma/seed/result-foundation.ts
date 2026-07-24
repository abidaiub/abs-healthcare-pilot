import type { PrismaClient } from "../../src/generated/prisma/client";

const CBC_REFERENCE_RANGES = [
  {
    parameterCode: "HGB",
    ranges: [
      {
        gender: "M",
        ageFromDays: 6570,
        ageToDays: null as number | null,
        normalLow: 13,
        normalHigh: 17,
        criticalLow: 7,
        criticalHigh: 20,
        unit: "g/dL",
        priority: 10,
      },
      {
        gender: "F",
        ageFromDays: 6570,
        ageToDays: null,
        normalLow: 12,
        normalHigh: 15,
        criticalLow: 7,
        criticalHigh: 20,
        unit: "g/dL",
        priority: 10,
      },
    ],
  },
  {
    parameterCode: "WBC",
    ranges: [
      {
        gender: null,
        ageFromDays: 6570,
        ageToDays: null,
        normalLow: 4000,
        normalHigh: 11000,
        criticalLow: 2000,
        criticalHigh: 30000,
        unit: "/cumm",
        priority: 10,
      },
    ],
  },
  {
    parameterCode: "PLT",
    ranges: [
      {
        gender: null,
        ageFromDays: 6570,
        ageToDays: null,
        normalLow: 150000,
        normalHigh: 450000,
        criticalLow: 50000,
        criticalHigh: 1000000,
        unit: "/cumm",
        priority: 10,
      },
    ],
  },
] as const;

export async function seedResultFoundation(prisma: PrismaClient, tenantCode = "ABMG") {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode } });
  if (!tenant) return;

  const cbcService = await prisma.tenantService.findFirst({
    where: {
      tenantId: tenant.id,
      hostService: { serviceCode: "CBC" },
    },
    include: {
      serviceParameters: true,
    },
  });

  if (!cbcService) {
    console.log("Result foundation skipped — CBC tenant service not found for", tenantCode);
    return;
  }

  for (const parameterSeed of CBC_REFERENCE_RANGES) {
    const parameter = cbcService.serviceParameters.find(
      (row) => row.parameterCode === parameterSeed.parameterCode,
    );
    if (!parameter) continue;

    for (const range of parameterSeed.ranges) {
      const existing = await prisma.serviceParameterReferenceRange.findFirst({
        where: {
          tenantId: tenant.id,
          serviceParameterId: parameter.id,
          gender: range.gender,
          ageFromDays: range.ageFromDays,
          priority: range.priority,
        },
      });

      if (existing) {
        await prisma.serviceParameterReferenceRange.update({
          where: { id: existing.id },
          data: {
            ageToDays: range.ageToDays,
            normalLow: range.normalLow,
            normalHigh: range.normalHigh,
            criticalLow: range.criticalLow,
            criticalHigh: range.criticalHigh,
            unit: range.unit,
            isActive: true,
          },
        });
      } else {
        await prisma.serviceParameterReferenceRange.create({
          data: {
            tenantId: tenant.id,
            serviceParameterId: parameter.id,
            gender: range.gender,
            ageFromDays: range.ageFromDays,
            ageToDays: range.ageToDays,
            normalLow: range.normalLow,
            normalHigh: range.normalHigh,
            criticalLow: range.criticalLow,
            criticalHigh: range.criticalHigh,
            unit: range.unit,
            priority: range.priority,
            isActive: true,
            createdBy: "seed",
          },
        });
      }
    }
  }

  console.log("Result foundation seed complete for", tenantCode);
}
