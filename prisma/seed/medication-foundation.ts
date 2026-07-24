import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_DOSAGE_FORMS,
  DEFAULT_ROUTES,
  DEFAULT_UNITS,
} from "../../src/lib/medication/constants";

const DEMO_MEDICATIONS = [
  {
    genericCode: "PARACETAMOL",
    genericName: "Paracetamol",
    manufacturerName: "Demo Pharma Ltd",
    brandName: "Demo Napa 500",
    strengthValue: 500,
    strengthUnit: "mg",
    dosageFormCode: "TABLET",
    routeCode: "ORAL",
    categoryCode: "ANALGESIC",
  },
  {
    genericCode: "AMOXICILLIN",
    genericName: "Amoxicillin",
    manufacturerName: "Demo Pharma Ltd",
    brandName: "Demo Amox 500",
    strengthValue: 500,
    strengthUnit: "mg",
    dosageFormCode: "CAPSULE",
    routeCode: "ORAL",
    categoryCode: "ANTIBIOTIC",
  },
] as const;

export async function seedMedicationFoundation(prisma: PrismaClient, tenantCode = "ABMG") {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode } });
  if (!tenant) return;

  const existingCount = await prisma.medicationCatalogItem.count({ where: { tenantId: tenant.id } });
  if (existingCount > 0) {
    console.log("Medication catalog seed skipped — existing catalog items present");
    return;
  }

  for (const form of DEFAULT_DOSAGE_FORMS) {
    await prisma.medicationDosageForm.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: form.code } },
      create: { tenantId: tenant.id, ...form },
      update: { displayName: form.displayName, shortName: form.shortName, isActive: true },
    });
  }
  for (const route of DEFAULT_ROUTES) {
    await prisma.medicationRoute.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: route.code } },
      create: { tenantId: tenant.id, ...route },
      update: { displayName: route.displayName, isActive: true },
    });
  }
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.medicationCategory.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: category.code } },
      create: { tenantId: tenant.id, ...category },
      update: { displayName: category.displayName, isActive: true },
    });
  }
  for (const unit of DEFAULT_UNITS) {
    await prisma.medicationUnit.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: unit.code } },
      create: { tenantId: tenant.id, ...unit },
      update: { displayName: unit.displayName, isActive: true },
    });
  }

  let counter = await prisma.tenantMedicationCounter.findUnique({ where: { tenantId: tenant.id } });
  if (!counter) {
    counter = await prisma.tenantMedicationCounter.create({
      data: { tenantId: tenant.id, lastNumber: 0 },
    });
  }

  for (const demo of DEMO_MEDICATIONS) {
    const category = await prisma.medicationCategory.findFirst({
      where: { tenantId: tenant.id, code: demo.categoryCode },
    });
    const dosageForm = await prisma.medicationDosageForm.findFirst({
      where: { tenantId: tenant.id, code: demo.dosageFormCode },
    });
    const route = await prisma.medicationRoute.findFirst({
      where: { tenantId: tenant.id, code: demo.routeCode },
    });

    const generic = await prisma.medicationGeneric.upsert({
      where: { tenantId_genericCode: { tenantId: tenant.id, genericCode: demo.genericCode } },
      create: {
        tenantId: tenant.id,
        genericCode: demo.genericCode,
        genericName: demo.genericName,
        categoryId: category?.id,
      },
      update: { genericName: demo.genericName, isActive: true },
    });

    const manufacturer = await prisma.medicationManufacturer.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: demo.manufacturerName } },
      create: { tenantId: tenant.id, name: demo.manufacturerName },
      update: { isActive: true },
    });

    counter = await prisma.tenantMedicationCounter.update({
      where: { tenantId: tenant.id },
      data: { lastNumber: { increment: 1 } },
    });

    await prisma.medicationCatalogItem.create({
      data: {
        tenantId: tenant.id,
        internalCode: `MED-${String(counter.lastNumber).padStart(6, "0")}`,
        brandName: demo.brandName,
        genericId: generic.id,
        genericDisplayName: demo.genericName,
        manufacturerId: manufacturer.id,
        categoryId: category?.id,
        dosageFormId: dosageForm?.id,
        routeId: route?.id,
        routeCode: demo.routeCode,
        strengthValue: demo.strengthValue,
        strengthUnit: demo.strengthUnit,
        displayStrength: `${demo.strengthValue} ${demo.strengthUnit}`,
        isPrescriptionEnabled: true,
        status: "ACTIVE",
        isActive: true,
      },
    });
  }

  console.log(`Medication catalog seed ensured demo reference data for ${tenantCode}`);
}
