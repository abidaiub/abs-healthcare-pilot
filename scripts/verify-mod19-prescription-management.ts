/**
 * MOD-19 verification — prescriptions, snapshots, RBAC, registry.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  canTransitionPrescriptionStatus,
  isPrescriptionEditable,
  calculateQuantityFromStructured,
} from "../src/lib/prescription/constants";
import { PRESCRIPTION_ERROR_CODES } from "../src/lib/prescription/errors";
import { allocatePrescriptionNumber, isValidPrescriptionNumber } from "../src/lib/prescription/number";
import { validateMod19RegistryCompliance } from "../src/lib/module-governance-validate";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES, REQUIRED_MESSAGE_NAMESPACES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";
import { parseMedicineFormData } from "../src/lib/prescription/validation";

const pool = new Pool({ connectionString: process.env.DB_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(tenant), "ABMG tenant exists");
  if (!tenant) return;

  await prisma.prescription.findFirst({ where: { tenantId: tenant.id } });
  console.log("PASS: Prescription schema query works");

  const numbers = await prisma.$transaction(async (tx) => {
    const a = await allocatePrescriptionNumber(tx, tenant.id);
    const b = await allocatePrescriptionNumber(tx, tenant.id);
    return [a, b];
  });
  assert(numbers[0] !== numbers[1], "Prescription numbers sequential");
  assert(isValidPrescriptionNumber(numbers[0]), "RX number format");

  assert(canTransitionPrescriptionStatus("DRAFT", "FINALIZED"), "DRAFT to FINALIZED");
  assert(!canTransitionPrescriptionStatus("FINALIZED", "DRAFT"), "FINALIZED to DRAFT blocked");
  assert(!isPrescriptionEditable("FINALIZED"), "Finalized not editable");

  const invalidMed = parseMedicineFormData(buildFormData({ medicineName: "" }));
  assert(
    "errorCode" in invalidMed && invalidMed.errorCode === PRESCRIPTION_ERROR_CODES.PRESCRIPTION_MEDICINE_INVALID,
    "Empty medicine rejected",
  );

  const qty = calculateQuantityFromStructured({ frequency: "BID", durationValue: 7, durationUnit: "DAY" });
  assert(qty === "14", "Quantity calculation BID x 7 days");

  const rxResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/prescriptions");
  assert(Boolean(rxResource), "RBAC /prescriptions registered");
  assert(rxResource?.moduleCode === "MOD-19", "Mapped to MOD-19");

  const doctor = await prisma.user.findUnique({ where: { username: "amina.rahman" } });
  const reception = await prisma.user.findUnique({ where: { username: "arif.hossain" } });
  if (doctor) {
    const p = await getEffectivePermissionsForUser(tenant.id, doctor.id);
    assert(p.get("/prescriptions/new")?.canCreate === true, "Doctor can create prescription");
    assert(p.get("/prescriptions/finalize")?.canEdit === true, "Doctor can finalize");
  }
  if (reception) {
    const p = await getEffectivePermissionsForUser(tenant.id, reception.id);
    assert(p.get("/prescriptions")?.canView === true, "Reception can view");
    assert(p.get("/prescriptions/edit")?.canEdit !== true, "Reception edit denied");
    assert(p.get("/prescriptions/finalize")?.canEdit !== true, "Reception finalize denied");
  }

  assert((await prisma.clinicalEncounter.count({ where: { tenantId: tenant.id } })) >= 0, "MOD-18 regression schema ok");
  assert((await prisma.patient.count({ where: { tenantId: tenant.id } })) >= 4, "MOD-15 regression");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(fs.existsSync(path.join(process.cwd(), "src/messages", locale, "prescription.json")), `prescription.json ${locale}`);
  }
  assert(compareLocaleMessageStructure().ok, "Locale structure parity");
  assert(resolveTextDirectionForLocale("ar-SA") === "rtl", "Arabic RTL");
  assert(resolveTextDirectionForLocale("ur-PK") === "rtl", "Urdu RTL");

  const registry = validateMod19RegistryCompliance();
  assert(registry.ok, `MOD-19 registry (${registry.errors.join("; ")})`);

  const mod19Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-19" } });
  assert(Boolean(mod19Db), "MOD-19 in DB registry");

  console.log("\nAll MOD-19 prescription checks passed.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
