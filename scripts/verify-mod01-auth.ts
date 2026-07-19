/**
 * MOD-01 verification script — host/tenant auth and tenant isolation checks.
 * Run: npx tsx scripts/verify-mod01-auth.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { verifyPassword } from "../src/lib/password";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main() {
  const host = await prisma.user.findUnique({ where: { username: "admin.abs" } });
  assert(Boolean(host?.isHostAdmin && !host.tenantId), "Host admin user exists");

  const tenantAdmin = await prisma.user.findUnique({
    where: { username: "laila.hasan" },
  });
  assert(Boolean(tenantAdmin?.tenantId && !tenantAdmin.isHostAdmin), "Tenant admin user exists");

  assert(
    host ? verifyPassword("Host@2026!", host.passwordHash) : false,
    "Valid host password accepted",
  );
  assert(
    host ? !verifyPassword("wrong-password", host.passwordHash) : false,
    "Invalid host password rejected",
  );
  assert(
    tenantAdmin ? verifyPassword("Tenant@2026!", tenantAdmin.passwordHash) : false,
    "Valid tenant password accepted",
  );
  assert(
    host && tenantAdmin
      ? !verifyPassword("Host@2026!", tenantAdmin.passwordHash)
      : false,
    "Host password cannot authenticate tenant user record",
  );

  const abmg = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(abmg), "ABMG tenant exists in database");

  const subscription = abmg
    ? await prisma.tenantSubscription.findFirst({
        where: { tenantId: abmg.id, isActive: true },
        include: { package: true },
      })
    : null;
  assert(Boolean(subscription?.package), "ABMG subscription seeded");

  const usageLimit = abmg
    ? await prisma.tenantUsageLimit.findUnique({ where: { tenantId: abmg.id } })
    : null;
  assert(Boolean(usageLimit), "ABMG usage limits seeded");

  const moduleCount = abmg
    ? await prisma.tenantModule.count({ where: { tenantId: abmg.id } })
    : 0;
  assert(moduleCount > 0, "ABMG tenant modules seeded");

  const packages = await prisma.subscriptionPackage.count();
  assert(packages >= 3, "Subscription packages seeded");

  console.log("\nAll MOD-01 auth/seed checks passed.");
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
