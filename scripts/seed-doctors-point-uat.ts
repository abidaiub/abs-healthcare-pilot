/**
 * Repeatable Doctors Point Diagnostic Center UAT seed runner.
 *
 * Run with: npm run seed:uat:doctors-point
 *
 * This is intentionally NOT wired into `prisma db seed`, so production startup never
 * depends on demo data. Running it twice is safe: every write is an upsert.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedHostDiagnosticCatalog } from "../prisma/seed/host-diagnostic-catalog";
import { seedModuleRegistry } from "../prisma/seed/tenant-diagnostic-masters";
import {
  UAT_PASSWORD,
  UAT_PORTAL_PASSWORD,
  seedDoctorsPointUat,
} from "../prisma/seed/uat/doctors-point-seed";

const ALLOW_IN_PRODUCTION = process.argv.includes("--force");

if (process.env.NODE_ENV === "production" && !ALLOW_IN_PRODUCTION) {
  console.error(
    "Refusing to run the Doctors Point UAT seed with NODE_ENV=production. Pass --force only if this is a deliberate UAT environment.",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // The approved host catalog is the source for every tenant service, so make sure it is
  // present and current before importing into the tenant.
  await seedHostDiagnosticCatalog(prisma);
  await seedModuleRegistry(prisma);

  const summary = await seedDoctorsPointUat(prisma);

  console.log("");
  console.log("Doctors Point Diagnostic Center UAT seed complete");
  console.log("-------------------------------------------------");
  console.log(`  Tenant id            : ${summary.tenantId}`);
  console.log(`  Branch id            : ${summary.branchId}`);
  console.log(`  Departments          : ${summary.departments}`);
  console.log(`  Roles                : ${summary.roles}`);
  console.log(`  Users                : ${summary.users}`);
  console.log(`  Doctors              : ${summary.doctors}`);
  console.log(`  Published shifts     : ${summary.publishedShifts}`);
  console.log(`  Priced services      : ${summary.services}`);
  console.log(`  Analyzer mappings    : ${summary.analyzerMappings}`);
  console.log(`  Reference ranges     : ${summary.referenceRanges}`);
  console.log(`  Range config gaps    : ${summary.referenceRangeGaps} (documented UAT-only fills)`);
  console.log(`  Patients             : ${summary.patients}`);
  console.log(`  Portal accounts      : ${summary.portalAccounts}`);
  console.log(`  Portal delegations   : ${summary.portalDelegations}`);
  console.log("");
  console.log(`  Shared staff password : ${UAT_PASSWORD}`);
  console.log(`  Shared portal password: ${UAT_PORTAL_PASSWORD}`);
  console.log("");
  console.log("Portal logins (normalised mobile as username):");
  console.log("  Case 1 patient  : 8801712200001");
  console.log("  Case 2 patient  : 8801712200002");
  console.log("  Case 3 guardian : 8801712200003  (delegation to Master Samiul Islam)");
  console.log("");

  if (summary.catalogGaps.length > 0) {
    console.log("Documented catalog gaps (not seeded):");
    for (const gap of summary.catalogGaps) {
      console.log(`  - ${gap.requestedTest}: ${gap.reason} ${gap.action}`);
    }
    console.log("");
  }
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
