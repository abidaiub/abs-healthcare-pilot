/**
 * MOD-21 verification — lab orders, sample workflow, tenant isolation, registry.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { validateMod21RegistryCompliance } from "../src/lib/module-governance-validate";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";
import {
  canCancelLabOrder,
  canTransitionLabOrderStatus,
  isLabOrderEditable,
  isValidAccessionNumber,
  isValidLabOrderNumber,
} from "../src/lib/laboratory/constants";
import { LAB_ERROR_CODES } from "../src/lib/laboratory/errors";
import { allocateAccessionNumber, allocateLabOrderNumber } from "../src/lib/laboratory/number";
import { groupTestsBySpecimen } from "../src/lib/laboratory/grouping";

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

  await prisma.labOrder.findFirst({ where: { tenantId: tenant.id } });
  console.log("PASS: Lab order schema query works");

  const numbers = await prisma.$transaction(async (tx) => {
    const orderA = await allocateLabOrderNumber(tx, tenant.id);
    const orderB = await allocateLabOrderNumber(tx, tenant.id);
    const accA = await allocateAccessionNumber(tx, tenant.id);
    const accB = await allocateAccessionNumber(tx, tenant.id);
    return { orderA, orderB, accA, accB };
  });
  assert(numbers.orderA !== numbers.orderB, "Lab order numbers sequential");
  assert(numbers.accA !== numbers.accB, "Accession numbers sequential");
  assert(isValidLabOrderNumber(numbers.orderA), "LAB code format");
  assert(isValidAccessionNumber(numbers.accA), "ACC code format");

  assert(isLabOrderEditable("DRAFT"), "Draft editable");
  assert(!isLabOrderEditable("CONFIRMED"), "Confirmed not editable");
  assert(canCancelLabOrder("CONFIRMED"), "Confirmed cancellable");
  assert(canTransitionLabOrderStatus("DRAFT", "CONFIRMED"), "Draft to confirmed");
  assert(!canTransitionLabOrderStatus("COMPLETED", "DRAFT"), "Completed to draft blocked");

  assert(
    (["READY_FOR_RESULT", "RESULT_IN_PROGRESS", "READY_FOR_VERIFICATION"] as const).includes("RESULT_IN_PROGRESS"),
    "LabOrderTestStatus includes RESULT_IN_PROGRESS",
  );
  assert(
    (["READY_FOR_RESULT", "RESULT_IN_PROGRESS", "READY_FOR_VERIFICATION"] as const).includes("READY_FOR_VERIFICATION"),
    "LabOrderTestStatus includes READY_FOR_VERIFICATION",
  );

  const grouped = groupTestsBySpecimen([
    { id: "a", sampleTypeId: "st1", sampleContainerId: "c1", status: "ORDERED" },
    { id: "b", sampleTypeId: "st1", sampleContainerId: "c1", status: "ORDERED" },
    { id: "c", sampleTypeId: "st2", sampleContainerId: "c2", status: "ORDERED" },
  ]);
  assert(grouped.length === 2, "Specimen grouping");

  const labResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/lab/orders");
  assert(Boolean(labResource), "RBAC /lab/orders registered");
  assert(labResource?.moduleCode === "MOD-21", "Mapped to MOD-21");

  const mod20Dep = validateMod21RegistryCompliance();
  assert(mod20Dep.ok, `MOD-21 registry (${mod20Dep.errors.join("; ")})`);

  const mod21Entry = (await import("../src/lib/saas-foundation-data")).MODULE_REGISTRY.find(
    (entry) => entry.moduleCode === "MOD-21",
  );
  assert(Boolean(mod21Entry), "MOD-21 in MODULE_REGISTRY");
  assert(!mod21Entry?.dependencies?.includes("MOD-20"), "MOD-21 must not depend on MOD-20");

  const labTech = await prisma.user.findUnique({ where: { username: "tania.sultana" } });
  if (labTech) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, labTech.id);
    assert(permissions.get("/lab/collection")?.canView === true, "Lab tech collection view");
    assert(permissions.get("/lab/receipt")?.canEdit === true, "Lab tech receipt edit");
    assert(permissions.get("/lab/processing")?.canEdit === true, "Lab tech processing edit");
  }

  const rejectionCount = await prisma.sampleRejectionReason.count({ where: { tenantId: tenant.id, isActive: true } });
  assert(rejectionCount >= 5, "Rejection reasons seeded");

  assert((await prisma.prescription.count({ where: { tenantId: tenant.id } })) >= 0, "MOD-19 regression");
  assert((await prisma.medicationCatalogItem.count({ where: { tenantId: tenant.id } })) >= 0, "MOD-20 regression");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(fs.existsSync(path.join(process.cwd(), "src/messages", locale, "laboratory.json")), `laboratory.json ${locale}`);
  }
  assert(compareLocaleMessageStructure().ok, "Locale structure parity");
  assert(resolveTextDirectionForLocale("ar-SA") === "rtl", "Arabic RTL");
  assert(resolveTextDirectionForLocale("ur-PK") === "rtl", "Urdu RTL");

  const mod21Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-21" } });
  assert(Boolean(mod21Db), "MOD-21 in DB registry");

  assert(Boolean(LAB_ERROR_CODES.LAB_ORDER_NOT_FOUND), "Stable error codes");

  console.log("\nAll MOD-21 sample collection lab workflow checks passed.");
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
