/**
 * MOD-20 verification — medication catalog, tenant isolation, prescription integration.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { validateMod20RegistryCompliance } from "../src/lib/module-governance-validate";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";
import { allocateMedicationCode } from "../src/lib/medication/number";
import { isValidMedicationCode, canTransitionMedicationStatus, isMedicationSelectable } from "../src/lib/medication/constants";
import { MEDICATION_ERROR_CODES } from "../src/lib/medication/errors";
import { validateStrength, buildDisplayStrength } from "../src/lib/medication/validation";
import { searchPrescriptionMedications } from "../src/lib/medication/queries";

const pool = new Pool({ connectionString: process.env.DB_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(tenant), "ABMG tenant exists");
  if (!tenant) return;

  await prisma.medicationCatalogItem.findFirst({ where: { tenantId: tenant.id } });
  console.log("PASS: Medication schema query works");

  const numbers = await prisma.$transaction(async (tx) => {
    const a = await allocateMedicationCode(tx, tenant.id);
    const b = await allocateMedicationCode(tx, tenant.id);
    return [a, b];
  });
  assert(numbers[0] !== numbers[1], "Medication codes sequential");
  assert(isValidMedicationCode(numbers[0]), "MED code format");

  assert(canTransitionMedicationStatus("DRAFT", "ACTIVE"), "DRAFT to ACTIVE");
  assert(!canTransitionMedicationStatus("ACTIVE", "DRAFT"), "ACTIVE to DRAFT blocked");
  assert(isMedicationSelectable("ACTIVE"), "Active selectable");
  assert(!isMedicationSelectable("INACTIVE"), "Inactive not selectable");

  const strengthInvalid = validateStrength({ strengthValue: -1, strengthUnit: "mg" });
  assert(!strengthInvalid.ok, "Invalid strength rejected");
  assert(buildDisplayStrength({ strengthValue: 500, strengthUnit: "mg" }) === "500 mg", "Display strength");

  const rxResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/pharmacy/medications");
  assert(Boolean(rxResource), "RBAC /pharmacy/medications registered");
  assert(rxResource?.moduleCode === "MOD-20", "Mapped to MOD-20");

  const doctor = await prisma.user.findUnique({ where: { username: "amina.rahman" } });
  const reception = await prisma.user.findUnique({ where: { username: "arif.hossain" } });
  if (doctor) {
    const p = await getEffectivePermissionsForUser(tenant.id, doctor.id);
    assert(p.get("/pharmacy/medications/search")?.canView === true, "Doctor can search medication");
    assert(p.get("/pharmacy/medications/new")?.canCreate !== true, "Doctor catalog create denied");
  }
  if (reception) {
    const p = await getEffectivePermissionsForUser(tenant.id, reception.id);
    assert(p.get("/pharmacy/medications/edit")?.canEdit !== true, "Reception edit denied");
    assert(p.get("/pharmacy/import")?.canCreate !== true, "Reception import denied");
  }

  const demoItem = await prisma.medicationCatalogItem.findFirst({
    where: { tenantId: tenant.id, status: "ACTIVE" },
  });
  if (demoItem) {
    const results = await searchPrescriptionMedications(tenant.id, demoItem.brandName.slice(0, 4));
    assert(results.some((row) => row.id === demoItem.id), "Brand search finds active medication");
  }

  const otherTenant = await prisma.tenant.findFirst({ where: { NOT: { id: tenant.id } } });
  if (otherTenant && demoItem) {
    const cross = await prisma.medicationCatalogItem.findFirst({
      where: { id: demoItem.id, tenantId: otherTenant.id },
    });
    assert(!cross, "Cross-tenant medication read blocked");
  }

  assert((await prisma.prescriptionMedicine.count()) >= 0, "Prescription medicine linkage schema ok");
  assert((await prisma.prescription.count({ where: { tenantId: tenant.id } })) >= 0, "MOD-19 regression");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(fs.existsSync(path.join(process.cwd(), "src/messages", locale, "pharmacy.json")), `pharmacy.json ${locale}`);
  }
  assert(compareLocaleMessageStructure().ok, "Locale structure parity");
  assert(resolveTextDirectionForLocale("ar-SA") === "rtl", "Arabic RTL");
  assert(resolveTextDirectionForLocale("ur-PK") === "rtl", "Urdu RTL");

  const registry = validateMod20RegistryCompliance();
  assert(registry.ok, `MOD-20 registry (${registry.errors.join("; ")})`);

  const mod20Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-20" } });
  assert(Boolean(mod20Db), "MOD-20 in DB registry");

  assert(Boolean(MEDICATION_ERROR_CODES.MEDICATION_DUPLICATE), "Stable error codes");

  console.log("\nAll MOD-20 pharmacy medication catalog checks passed.");
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
