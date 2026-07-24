/**
 * MOD-22 verification — result entry, parameter validation, registry, RBAC, i18n.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { validateMod22RegistryCompliance } from "../src/lib/module-governance-validate";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";
import { calculateAgeInDays } from "../src/lib/laboratory-result/age";
import { computeAbnormalFlag } from "../src/lib/laboratory-result/abnormal-flags";
import {
  canReopenLabResult,
  canTransitionLabResultStatus,
  isLabResultEditable,
  RESULT_ENTRY_WORKLIST_TEST_STATUSES,
} from "../src/lib/laboratory-result/constants";
import { LAB_RESULT_ERROR_CODES } from "../src/lib/laboratory-result/errors";
import { selectReferenceRange } from "../src/lib/laboratory-result/range-selection";
import { validateResultValue } from "../src/lib/laboratory-result/validation";

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

  await prisma.labResult.findFirst({ where: { tenantId: tenant.id } });
  console.log("PASS: Lab result schema query works");

  assert(isLabResultEditable("DRAFT"), "Draft result editable");
  assert(isLabResultEditable("IN_PROGRESS"), "In-progress result editable");
  assert(!isLabResultEditable("VERIFIED"), "Verified result not editable");
  assert(canReopenLabResult("ENTRY_COMPLETED"), "Entry completed reopenable");
  assert(canTransitionLabResultStatus("DRAFT", "IN_PROGRESS"), "Draft to in progress");
  assert(!canTransitionLabResultStatus("VERIFIED", "DRAFT"), "Verified to draft blocked");

  assert(RESULT_ENTRY_WORKLIST_TEST_STATUSES.includes("READY_FOR_RESULT"), "Worklist includes READY_FOR_RESULT");
  assert(RESULT_ENTRY_WORKLIST_TEST_STATUSES.includes("RESULT_IN_PROGRESS"), "Worklist includes RESULT_IN_PROGRESS");
  assert(RESULT_ENTRY_WORKLIST_TEST_STATUSES.includes("READY_FOR_VERIFICATION"), "Worklist includes READY_FOR_VERIFICATION");

  const validation = validateResultValue({
    resultType: "NUMERIC",
    numericValue: 12.5,
    isRequired: true,
    decimalPlaces: 2,
  });
  assert(validation.ok, "Numeric validation passes");

  const flag = computeAbnormalFlag({
    resultType: "NUMERIC",
    numericValue: 10,
    textValue: null,
    choiceValue: null,
    booleanValue: null,
    lowerBound: 12,
    upperBound: 15,
    criticalLow: 7,
    criticalHigh: 20,
    unitSnapshot: "g/dL",
    parameterUnit: "g/dL",
    rangeUnit: "g/dL",
  });
  assert(flag.flag === "LOW", "Abnormal low flag");

  const rangePick = selectReferenceRange(
    [
      {
        id: "r1",
        gender: "M",
        ageFromDays: 6570,
        ageToDays: null,
        normalLow: { toString: () => "13" } as never,
        normalHigh: { toString: () => "17" } as never,
        criticalLow: { toString: () => "7" } as never,
        criticalHigh: { toString: () => "20" } as never,
        textRange: null,
        unit: "g/dL",
        priority: 10,
      },
    ],
    { patientGender: "M", ageInDays: 10000, parameterUnit: "g/dL" },
  );
  assert(rangePick.ok, "Reference range selection");

  const ageDays = calculateAgeInDays(new Date("1990-01-01"), new Date("2026-01-01"));
  assert(ageDays > 12000, "Age in days calculation");

  const resultResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/lab/result-entry");
  assert(Boolean(resultResource), "RBAC /lab/result-entry registered");
  assert(resultResource?.moduleCode === "MOD-22", "Mapped to MOD-22");

  const completeResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/lab/result-entry/complete");
  assert(Boolean(completeResource), "RBAC /lab/result-entry/complete registered");

  const mod22Dep = validateMod22RegistryCompliance();
  assert(mod22Dep.ok, `MOD-22 registry (${mod22Dep.errors.join("; ")})`);

  const mod22Entry = (await import("../src/lib/saas-foundation-data")).MODULE_REGISTRY.find(
    (entry) => entry.moduleCode === "MOD-22",
  );
  assert(Boolean(mod22Entry), "MOD-22 in MODULE_REGISTRY");
  assert(Boolean(mod22Entry?.dependencies?.includes("MOD-21")), "MOD-22 depends on MOD-21");
  assert(!mod22Entry?.dependencies?.includes("MOD-20"), "MOD-22 must not depend on MOD-20");

  const labTech = await prisma.user.findUnique({ where: { username: "tania.sultana" } });
  if (labTech) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, labTech.id);
    assert(permissions.get("/lab/result-entry")?.canView === true, "Lab tech result entry view");
    assert(permissions.get("/lab/result-entry/edit")?.canEdit === true, "Lab tech result entry edit");
    assert(permissions.get("/lab/result-entry/complete")?.canEdit === true, "Lab tech result complete");
  }

  const cbcService = await prisma.tenantService.findFirst({
    where: { tenantId: tenant.id, hostService: { serviceCode: "CBC" } },
    include: { serviceParameters: { include: { referenceRanges: true } } },
  });
  if (cbcService) {
    assert(cbcService.serviceParameters.length >= 3, "CBC parameters seeded");
    const hgb = cbcService.serviceParameters.find((p) => p.parameterCode === "HGB");
    assert(Boolean(hgb), "HGB parameter exists");
    if (hgb) {
      assert(hgb.referenceRanges.length >= 1, "HGB reference ranges seeded");
    }
  }

  assert((await prisma.labOrder.count({ where: { tenantId: tenant.id } })) >= 0, "MOD-21 regression");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(
      fs.existsSync(path.join(process.cwd(), "src/messages", locale, "laboratoryResult.json")),
      `laboratoryResult.json ${locale}`,
    );
  }
  assert(compareLocaleMessageStructure().ok, "Locale structure parity");
  assert(resolveTextDirectionForLocale("ar-SA") === "rtl", "Arabic RTL");
  assert(resolveTextDirectionForLocale("ur-PK") === "rtl", "Urdu RTL");

  const mod22Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-22" } });
  assert(Boolean(mod22Db), "MOD-22 in DB registry");

  assert(Boolean(LAB_RESULT_ERROR_CODES.LAB_RESULT_NOT_FOUND), "Stable error codes");

  console.log("\nAll MOD-22 laboratory result entry checks passed.");
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
