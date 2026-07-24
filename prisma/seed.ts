import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, TenantType } from "../src/generated/prisma/client";
import {
  seedHostDiagnosticCatalog,
  seedTenantReferenceTestMethods,
} from "./seed/host-diagnostic-catalog";
import { seedModuleRegistry, seedTenantDiagnosticMasters } from "./seed/tenant-diagnostic-masters";
import { seedTenantImportedServices } from "./seed/tenant-imported-services";
import { seedSaasFoundation } from "./seed/saas-foundation";
import { seedTenantRbacFoundation } from "./seed/rbac-foundation";
import { seedTenantAuditSamples } from "./seed/audit-foundation";
import {
  ensureAbmgLocaleProfile,
  migrateTenantLocaleProfiles,
} from "./seed/tenant-locale-migration";
import { seedLocalizationFoundation } from "./seed/localization-foundation";
import { seedBranchFoundation } from "./seed/branch-foundation";
import { seedPatientFoundation } from "./seed/patient-foundation";
import { seedAppointmentFoundation } from "./seed/appointment-foundation";
import { seedMedicationFoundation } from "./seed/medication-foundation";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedHostDiagnosticCatalog(prisma);
  await seedModuleRegistry(prisma);

  const tenant = await prisma.tenant.upsert({
    where: { tenantCode: "ABMG" },
    update: {},
    create: {
      tenantCode: "ABMG",
      tenantName: "Al Baraka Medical Group",
      shortCode: "ABMG",
      contactPerson: "Syed Asif Iqbal",
      contactMobile: "+880 17 0000 0000",
      contactEmail: "admin@albarakamedical.com",
      country: "Bangladesh",
      tenantType: TenantType.MIXED,
      address: "12/A Dhanmondi, Dhaka 1209",
      city: "Dhaka",
    },
  });

  const branch = await prisma.branch.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: "BR-DHK-01",
      },
    },
    update: {
      isDefault: false,
      branchType: "HOSPITAL",
      addressLine1: "12/A Dhanmondi, Dhaka 1209",
    },
    create: {
      tenantId: tenant.id,
      code: "BR-DHK-01",
      name: "Dhaka Central Hospital",
      branchType: "HOSPITAL",
      address: "12/A Dhanmondi, Dhaka 1209",
      addressLine1: "12/A Dhanmondi, Dhaka 1209",
      phone: "+880 17 0000 0001",
      email: "dhaka@albarakamedical.com",
      isDefault: false,
      timezone: "Asia/Dhaka",
      countryCode: "BD",
    },
  });

  await seedTenantReferenceTestMethods(prisma, tenant.id);
  await migrateTenantLocaleProfiles(prisma);
  await ensureAbmgLocaleProfile(prisma, tenant.id);
  await seedLocalizationFoundation(prisma);
  await seedSaasFoundation(prisma, tenant.id);
  await seedTenantRbacFoundation(prisma, tenant.id, branch.id);
  await seedBranchFoundation(prisma, tenant.id);
  await seedPatientFoundation(prisma, tenant.id);
  await seedAppointmentFoundation(prisma, tenant.id);
  await seedMedicationFoundation(prisma, tenant.tenantCode);

  const adminUser = await prisma.user.findUnique({
    where: { username: "laila.hasan" },
    select: { id: true },
  });
  if (adminUser) {
    await seedTenantAuditSamples(prisma, tenant.id, branch.id, adminUser.id);
  }

  await seedTenantImportedServices(prisma, tenant.id, branch.id);
  await seedTenantDiagnosticMasters(prisma, tenant.id, branch.id);

  console.log(
    "Seed complete: host catalog, module registry, ABMG tenant services, and diagnostic masters",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
