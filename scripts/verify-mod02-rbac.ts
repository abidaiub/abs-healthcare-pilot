/**
 * MOD-02 / MOD-03 verification script — tenant RBAC, users, roles, permissions, lockout.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { verifyPassword } from "../src/lib/password";
import {
  getEffectivePermissionsForUser,
  listTenantRoles,
  listTenantUsers,
} from "../src/lib/rbac/queries";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type Check = { name: string; pass: boolean; detail?: string };

const checks: Check[] = [];

function record(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  record("ABMG tenant exists", Boolean(tenant));
  if (!tenant) process.exit(1);

  const users = await listTenantUsers(tenant.id);
  record("Tenant users seeded", users.length >= 4, `count=${users.length}`);

  const roles = await listTenantRoles(tenant.id);
  record("Tenant roles seeded", roles.length >= 4, `count=${roles.length}`);

  const admin = await prisma.user.findUnique({
    where: { username: "laila.hasan" },
    include: {
      userRoles: { where: { isActive: true }, include: { role: true } },
      userBranches: { where: { isActive: true }, include: { branch: true } },
    },
  });
  record("Tenant admin user exists", Boolean(admin));
  record(
    "Tenant admin has primary role",
    admin?.userRoles.some((entry) => entry.isPrimary) ?? false,
  );
  record(
    "Tenant admin has primary branch",
    admin?.userBranches.some((entry) => entry.isPrimary) ?? false,
  );

  const reception = await prisma.user.findUnique({ where: { username: "arif.hossain" } });
  record("Reception user exists", Boolean(reception));
  if (reception) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, reception.id);
    record(
      "Reception can view patient registration",
      permissions.get("/patients/new")?.canView ?? false,
    );
    record(
      "Reception cannot manage users",
      !(permissions.get("/settings/users")?.canView ?? false),
    );
  }

  const labTech = await prisma.user.findUnique({ where: { username: "tania.sultana" } });
  record("Lab tech user exists", Boolean(labTech));
  if (labTech) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, labTech.id);
    record(
      "Lab tech can view sample collection",
      permissions.get("/lab/sample-collection")?.canView ?? false,
    );
  }

  const tenantAdminRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, roleCode: "TENANT_ADMIN" },
    include: { permissions: { where: { isActive: true } } },
  });
  record(
    "Tenant admin role has permission matrix",
    (tenantAdminRole?.permissions.length ?? 0) >= 10,
    `count=${tenantAdminRole?.permissions.length ?? 0}`,
  );

  if (admin) {
    record(
      "Tenant admin password verifies",
      verifyPassword("Tenant@2026!", admin.passwordHash),
    );
  }

  const failed = checks.filter((check) => !check.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);

  if (failed.length > 0) {
    console.error("\nFailed checks:");
    for (const check of failed) {
      console.error(`- ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
    }
    process.exit(1);
  }

  console.log("\nAll MOD-02/MOD-03 checks passed.");
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
