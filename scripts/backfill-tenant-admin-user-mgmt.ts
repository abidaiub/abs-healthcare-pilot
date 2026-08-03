/**
 * Safe backfill: ensure every active tenant with a standard Tenant Admin role
 * receives the recommended user-management allowlist + operational roles.
 *
 * Idempotent. Does not strip custom extra permissions.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { TENANT_ADMIN_ROLE_CODES } from "../src/lib/saas/tenant-admin-access";
import { ensureTenantAdminRbacBaseline } from "../src/lib/saas/tenant-rbac-provisioning";

async function main() {
  const actor = "backfill.tenant-admin-user-mgmt";
  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      tenantStatus: { not: "ARCHIVED" },
    },
    select: {
      id: true,
      tenantCode: true,
      tenantName: true,
      roles: {
        where: {
          roleCode: { in: [...TENANT_ADMIN_ROLE_CODES] },
          isActive: true,
        },
        select: { id: true, roleCode: true },
      },
    },
    orderBy: { tenantCode: "asc" },
  });

  const timestamp = new Date().toISOString();
  console.log(`Backfill started at ${timestamp}`);
  console.log(`Tenants scanned: ${tenants.length}`);

  let processed = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    if (tenant.roles.length === 0) {
      console.log(`[SKIP] ${tenant.tenantCode} — no standard Tenant Admin role`);
      skipped += 1;
      continue;
    }

    const result = await ensureTenantAdminRbacBaseline(prisma, {
      tenantId: tenant.id,
      actor,
    });

    if (!result) {
      console.log(`[SKIP] ${tenant.tenantCode} — baseline helper returned null`);
      skipped += 1;
      continue;
    }

    processed += 1;
    console.log(
      `[OK] ${tenant.tenantCode} role=${tenant.roles.map((r) => r.roleCode).join(",")} ` +
        `grantsAdded=${result.grantsAdded.length} ` +
        `rolesCreated=${result.rolesCreated.length} ` +
        `rolesUpdated=${result.rolesUpdated.length} ` +
        `permissionsUpserted=${result.permissionsUpserted} ` +
        `sodDenies=${result.sodDeniesApplied}`,
    );
    if (result.grantsAdded.length) {
      console.log(`       grants: ${result.grantsAdded.join(", ")}`);
    }
    if (result.rolesCreated.length) {
      console.log(`       new roles: ${result.rolesCreated.join(", ")}`);
    }
  }

  console.log(
    `Backfill complete — processed=${processed} skipped=${skipped} at ${new Date().toISOString()} source=${actor}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
