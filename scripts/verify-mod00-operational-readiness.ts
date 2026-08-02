import "dotenv/config";
import { prisma } from "../src/lib/db";
import { loadOperationalReadiness } from "../src/lib/operational-readiness/queries";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";

async function main() {
  const readinessResource = TENANT_PERMISSION_RESOURCES.find(
    (r) => r.resourceKey === "/settings/readiness",
  );
  if (!readinessResource) {
    throw new Error("MOD-00 permission resource missing from catalog");
  }

  const tenant = await prisma.tenant.findFirst({
    where: { tenantCode: "DPDC" },
    select: { id: true, tenantCode: true, tenantName: true },
  });
  if (!tenant) {
    throw new Error("DPDC tenant not found — run seed:uat:doctors-point first");
  }

  const adminRole = await prisma.role.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [{ roleCode: "DP_TENANT_ADMIN" }, { roleCode: "TENANT_ADMIN" }],
    },
  });
  if (!adminRole) throw new Error("Tenant admin role missing");

  const permission = await prisma.permission.findUnique({
    where: {
      roleId_resourceKey: {
        roleId: adminRole.id,
        resourceKey: "/settings/readiness",
      },
    },
  });
  if (!permission?.canView || !permission.canEdit || !permission.canApprove) {
    throw new Error("Tenant admin missing /settings/readiness permissions");
  }

  const report = await loadOperationalReadiness(tenant.id);
  console.log(`Tenant: ${tenant.tenantCode} (${tenant.tenantName})`);
  console.log(`Score: ${report.scorePercent}%`);
  console.log(`Status: ${report.readyStatus}`);
  console.log(`Can declare: ${report.canDeclareReady}`);
  for (const item of report.items) {
    console.log(`- [${item.tone}] ${item.label}: ${item.detail}`);
  }

  const requiredScreens = [
    "/settings/readiness",
    "/settings/readiness/company",
    "/settings/readiness/departments",
    "/settings/readiness/users",
    "/settings/readiness/doctors",
    "/settings/readiness/catalog",
    "/settings/readiness/reference-ranges",
    "/settings/readiness/analyzers",
    "/settings/readiness/lis",
    "/settings/readiness/portal",
  ];
  console.log(`Screens expected: ${requiredScreens.length}`);
  console.log("verify:mod00 PASS (engine + RBAC wired)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
