#!/usr/bin/env tsx
/**
 * CLI: Import host diagnostic services into a tenant.
 *
 * Usage:
 *   npx tsx scripts/import-host-services.ts --tenant-code ABMG --codes CBC,FBS,XRCHEST --all-branches
 *   npx tsx scripts/import-host-services.ts --tenant-id <cuid> --codes CBC --branch-codes BR-DHK-01
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { importHostServicesByCode } from "../src/lib/diagnostic/host-service-import";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  const tenantCode = readArg("--tenant-code");
  const tenantIdArg = readArg("--tenant-id");
  const codesArg = readArg("--codes");
  const branchCodesArg = readArg("--branch-codes");
  const assignAllBranches = hasFlag("--all-branches");

  if (!codesArg) {
    console.error("Missing required --codes CSV (e.g. CBC,FBS,XRCHEST)");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    let tenantId = tenantIdArg;

    if (!tenantId && tenantCode) {
      const tenant = await prisma.tenant.findUnique({
        where: { tenantCode },
        select: { id: true, tenantCode: true },
      });
      if (!tenant) {
        console.error(`Tenant not found for code: ${tenantCode}`);
        process.exit(1);
      }
      tenantId = tenant.id;
    }

    if (!tenantId) {
      console.error("Provide --tenant-id or --tenant-code");
      process.exit(1);
    }

    let branchIds: string[] | undefined;
    if (branchCodesArg) {
      const branchCodes = branchCodesArg.split(",").map((c) => c.trim()).filter(Boolean);
      const branches = await prisma.branch.findMany({
        where: { tenantId, code: { in: branchCodes }, isActive: true },
        select: { id: true, code: true },
      });
      if (branches.length !== branchCodes.length) {
        console.error("One or more branch codes were not found for tenant.");
        process.exit(1);
      }
      branchIds = branches.map((b) => b.id);
    }

    const result = await importHostServicesByCode(prisma, {
      tenantId,
      serviceCodes: codesArg.split(",").map((c) => c.trim()).filter(Boolean),
      branchIds,
      assignAllBranches,
      createdBy: "import-host-services-script",
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
