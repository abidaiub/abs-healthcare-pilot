/**
 * MOD-23 verification — pathologist verification, corrections, registry, RBAC, i18n.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { validateMod23RegistryCompliance } from "../src/lib/module-governance-validate";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";
import { isLabResultCorrectable } from "../src/lib/laboratory-result/constants";
import {
  canStartCorrection,
  isResultCorrectable,
  isResultLocked,
  isResultReadyForVerification,
  REJECTION_REASON_CODES,
} from "../src/lib/laboratory-verification/constants";
import { LAB_VERIFICATION_ERROR_CODES } from "../src/lib/laboratory-verification/errors";
import { parseAffectedParameterIds, serializeAffectedParameterIds } from "../src/lib/laboratory-verification/parameter-ids";
import { SCREENS } from "../src/lib/module-registry";

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

  await prisma.labResultVerification.findFirst({ where: { tenantId: tenant.id } });
  console.log("PASS: Lab result verification schema query works");

  assert(isResultReadyForVerification("READY_FOR_VERIFICATION"), "Ready for verification status");
  assert(!isResultReadyForVerification("DRAFT"), "Draft not ready for verification");
  assert(isResultLocked("VERIFIED"), "Verified result locked");
  assert(isResultCorrectable("REJECTED_FOR_CORRECTION"), "Rejected result correctable");
  assert(isResultCorrectable("IN_PROGRESS"), "In progress correctable during correction");
  assert(isLabResultCorrectable("REJECTED_FOR_CORRECTION"), "MOD-22 correctable alias");
  assert(canStartCorrection("OPEN"), "Open correction can start");
  assert(!canStartCorrection("RESOLVED"), "Resolved correction cannot start");

  assert(REJECTION_REASON_CODES.includes("OTHER"), "Rejection reason codes defined");
  assert(parseAffectedParameterIds(JSON.stringify(["a", "b"])).length === 2, "Parse affected parameters");
  assert(serializeAffectedParameterIds(["x"]) !== null, "Serialize affected parameters");

  const verificationRoutes = [
    "/lab/verification",
    "/lab/verification/review",
    "/lab/verification/verify",
    "/lab/verification/reject",
    "/lab/verification/history",
    "/lab/corrections",
    "/lab/corrections/resubmit",
  ];
  for (const route of verificationRoutes) {
    const resource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === route);
    assert(Boolean(resource), `RBAC ${route} registered`);
    assert(resource?.moduleCode === "MOD-23", `${route} mapped to MOD-23`);
  }

  assert(Boolean(SCREENS.verificationReview), "verificationReview screen registered");
  assert(Boolean(SCREENS.verificationHistory), "verificationHistory screen registered");
  assert(Boolean(SCREENS.correctionWorklist), "correctionWorklist screen registered");

  const mod23Compliance = validateMod23RegistryCompliance();
  assert(mod23Compliance.ok, `MOD-23 registry (${mod23Compliance.errors.join("; ")})`);

  const mod23Entry = (await import("../src/lib/saas-foundation-data")).MODULE_REGISTRY.find(
    (entry) => entry.moduleCode === "MOD-23",
  );
  assert(Boolean(mod23Entry), "MOD-23 in MODULE_REGISTRY");
  assert(Boolean(mod23Entry?.dependencies?.includes("MOD-22")), "MOD-23 depends on MOD-22");
  assert(Boolean(mod23Entry?.dependencies?.includes("MOD-21")), "MOD-23 depends on MOD-21");
  assert(!mod23Entry?.dependencies?.includes("MOD-20"), "MOD-23 must not depend on MOD-20");

  const labTech = await prisma.user.findUnique({ where: { username: "tania.sultana" } });
  if (labTech) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, labTech.id);
    assert(permissions.get("/lab/verification")?.canView === true, "Lab tech verification view");
    assert(permissions.get("/lab/verification")?.canApprove !== true, "Lab tech cannot approve verification");
    assert(permissions.get("/lab/verification/verify")?.canApprove !== true, "Lab tech cannot verify");
    assert(permissions.get("/lab/corrections")?.canEdit === true, "Lab tech corrections edit");
    assert(permissions.get("/lab/corrections/resubmit")?.canEdit === true, "Lab tech resubmit");
  }

  const pathologist = await prisma.user.findUnique({ where: { username: "mahmuda.khatun" } });
  if (pathologist) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, pathologist.id);
    assert(permissions.get("/lab/verification/verify")?.canApprove === true, "Pathologist can verify");
    assert(permissions.get("/lab/verification/reject")?.canApprove === true, "Pathologist can reject");
    assert(permissions.get("/lab/verification/history")?.canView === true, "Pathologist history view");
  }

  const pathologistRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, roleCode: "PATHOLOGIST" },
  });
  assert(Boolean(pathologistRole), "PATHOLOGIST role seeded");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(
      fs.existsSync(path.join(process.cwd(), "src/messages", locale, "laboratoryVerification.json")),
      `laboratoryVerification.json ${locale}`,
    );
  }
  assert(compareLocaleMessageStructure().ok, "Locale structure parity");
  assert(resolveTextDirectionForLocale("ar-SA") === "rtl", "Arabic RTL");

  const mod23Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-23" } });
  assert(Boolean(mod23Db), "MOD-23 in DB registry");

  assert(Boolean(LAB_VERIFICATION_ERROR_CODES.LAB_VERIFICATION_NOT_FOUND), "Stable verification error codes");

  console.log("\nAll MOD-23 pathologist verification checks passed.");
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
