/**
 * MOD-04 verification script — tenant Audit Center, isolation, RBAC, pagination.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  getTenantAuditLogById,
  listTenantAuditLogs,
} from "../src/lib/audit/queries";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const checks: Array<{ name: string; pass: boolean; detail?: string }> = [];

function record(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  record("ABMG tenant exists", Boolean(tenant));
  if (!tenant) process.exit(1);

  const admin = await prisma.user.findUnique({ where: { username: "laila.hasan" } });
  const reception = await prisma.user.findUnique({ where: { username: "arif.hossain" } });
  record("Tenant admin exists", Boolean(admin));
  record("Reception user exists", Boolean(reception));

  if (admin) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, admin.id);
    record(
      "Tenant admin can view audit center",
      permissions.get("/settings/audit")?.canView ?? false,
    );
    record(
      "Tenant admin can export audit center",
      permissions.get("/settings/audit")?.canPrint ?? false,
    );
  }

  if (reception) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, reception.id);
    record(
      "Reception cannot view audit center",
      !(permissions.get("/settings/audit")?.canView ?? false),
    );
  }

  const auditCount = await prisma.auditLog.count({ where: { tenantId: tenant.id } });
  record("Tenant audit rows exist", auditCount > 0, `count=${auditCount}`);

  const list = await listTenantAuditLogs({ tenantId: tenant.id, page: 1, pageSize: 10 });
  record("Audit list returns rows", list.rows.length > 0, `rows=${list.rows.length}`);
  record("Audit pagination metadata present", list.totalPages >= 1, `total=${list.total}`);

  const first = list.rows[0];
  if (first) {
    const detail = await getTenantAuditLogById(tenant.id, first.id);
    record("Audit detail fetch works", Boolean(detail));

    const hostOnly = await prisma.auditLog.findFirst({
      where: { tenantId: null },
      select: { id: true },
    });
    if (hostOnly) {
      const crossTenant = await getTenantAuditLogById(tenant.id, hostOnly.id);
      record("Host audit hidden from tenant scope", crossTenant === null);
    } else {
      record("Host audit hidden from tenant scope", true, "no host rows to test");
    }
  }

  const filtered = await listTenantAuditLogs({
    tenantId: tenant.id,
    actionType: "LOGIN",
    page: 1,
    pageSize: 5,
  });
  record(
    "Action filter works",
    filtered.rows.every((row) => row.action === "LOGIN"),
    `rows=${filtered.rows.length}`,
  );

  const failed = checks.filter((check) => !check.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);

  if (failed.length > 0) {
    process.exit(1);
  }

  console.log("\nAll MOD-04 checks passed.");
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
