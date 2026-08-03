/**
 * Verifies new-tenant Tenant Admin can independently manage operational users
 * and go-live setup without Host intervention after creation.
 */
import "dotenv/config";
import { hashPassword } from "../src/lib/password";
import { prisma } from "../src/lib/db";
import { RECOMMENDED_TENANT_ADMIN_GRANT_IDS, TENANT_ADMIN_ACCESS_GRANTS, isTenantAdminRoleCode } from "../src/lib/saas/tenant-admin-access";
import { OPERATIONAL_ROLE_TEMPLATES } from "../src/lib/saas/tenant-role-templates";
import { provisionTenantRbacBaseline } from "../src/lib/saas/tenant-rbac-provisioning";
import { getEffectivePermissionsForUser, listTenantRoles } from "../src/lib/rbac/queries";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main() {
  const stamp = Date.now().toString(36).toUpperCase();
  const tenantCode = `TAUM${stamp}`.slice(0, 12);
  const actor = "verify.tenant-admin-user-mgmt";

  const otherTenant = await prisma.tenant.findFirst({
    where: { tenantCode: { not: tenantCode }, isActive: true },
    select: {
      id: true,
      branches: { where: { isActive: true }, take: 1, select: { id: true } },
      roles: { where: { isActive: true }, take: 1, select: { id: true } },
      departments: { where: { isActive: true }, take: 1, select: { id: true } },
    },
  });

  const created = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        tenantCode,
        tenantName: `Tenant Admin UAT ${stamp}`,
        shortCode: tenantCode.slice(0, 6),
        contactPerson: "UAT Admin",
        contactMobile: "+8801700000001",
        contactEmail: `${tenantCode.toLowerCase()}@uat.test`,
        address: "UAT Road",
        city: "Dhaka",
        district: "Dhaka",
        country: "Bangladesh",
        countryCode: "BD",
        tenantType: "DIAGNOSTIC",
        tenantStatus: "TRIAL",
        onboardingStatus: "SETUP_PENDING",
        createdBy: actor,
        updatedBy: actor,
      },
    });

    const role = await tx.role.create({
      data: {
        tenantId: tenant.id,
        roleCode: "TENANT_ADMIN",
        roleName: "Primary Tenant Admin",
        description: "Primary tenant administrator",
        createdBy: actor,
      },
    });

    const admin = await tx.user.create({
      data: {
        tenantId: tenant.id,
        username: `admin.${tenantCode.toLowerCase()}`,
        email: `admin.${tenantCode.toLowerCase()}@uat.test`,
        passwordHash: hashPassword("TenantAdmin@2026!"),
        isHostAdmin: false,
        createdBy: actor,
        updatedBy: actor,
      },
    });

    await tx.userRole.create({
      data: {
        tenantId: tenant.id,
        userId: admin.id,
        roleId: role.id,
        isPrimary: true,
        createdBy: actor,
      },
    });

    const provision = await provisionTenantRbacBaseline(tx, {
      tenantId: tenant.id,
      adminRoleId: role.id,
      actor,
      writeAudit: true,
      adminUserId: admin.id,
      tenantCode: tenant.tenantCode,
      tenantName: tenant.tenantName,
      city: tenant.city,
      address: tenant.address,
      phone: tenant.contactMobile,
      email: tenant.contactEmail,
    });

    // Idempotency: second call must not fail
    await provisionTenantRbacBaseline(tx, {
      tenantId: tenant.id,
      adminRoleId: role.id,
      actor,
      writeAudit: false,
      adminUserId: admin.id,
      tenantCode: tenant.tenantCode,
      tenantName: tenant.tenantName,
    });

    return { tenant, role, admin, provision };
  });

  assert(Boolean(created.tenant.id), "New tenant provisioned");
  assert(created.provision.grantsAdded.length > 0, "Recommended grants added on first provision");

  const perms = await getEffectivePermissionsForUser(created.tenant.id, created.admin.id);
  for (const grant of TENANT_ADMIN_ACCESS_GRANTS) {
    if (!RECOMMENDED_TENANT_ADMIN_GRANT_IDS.includes(grant.id)) continue;
    const row = perms.get(grant.resourceKey);
    assert(Boolean(row?.[grant.action]), `Admin has ${grant.id} (${grant.resourceKey}.${grant.action})`);
  }

  assert(
    perms.get("/lab/verification/verify")?.canApprove !== true,
    "Admin cannot clinically verify results",
  );
  assert(
    perms.get("/lab/report-release/release")?.canApprove !== true,
    "Admin cannot clinically release reports",
  );

  const branches = await prisma.branch.count({
    where: { tenantId: created.tenant.id, isActive: true },
  });
  assert(branches >= 1, "Default operating branch exists");

  const adminBranch = await prisma.userBranch.findFirst({
    where: { userId: created.admin.id, isPrimary: true, isActive: true },
  });
  assert(Boolean(adminBranch), "Admin assigned to primary branch");

  const departments = await prisma.department.count({
    where: { tenantId: created.tenant.id, isActive: true },
  });
  assert(departments >= 8, `Suggested departments provisioned (count=${departments})`);

  const roles = await listTenantRoles(created.tenant.id, { activeOnly: true });
  for (const template of OPERATIONAL_ROLE_TEMPLATES) {
    assert(
      roles.some((role) => role.roleCode === template.roleCode),
      `Operational role ${template.roleCode} exists`,
    );
  }

  const assignable = await listTenantRoles(created.tenant.id, {
    activeOnly: true,
    excludeAdminRoles: true,
  });
  assert(
    assignable.every((role) => !isTenantAdminRoleCode(role.roleCode)),
    "Assignable role list excludes Tenant Admin roles",
  );
  assert(
    assignable.some((role) => role.roleCode === "RECEPTION"),
    "Reception role is assignable",
  );

  const receptionRole = await prisma.role.findFirst({
    where: { tenantId: created.tenant.id, roleCode: "RECEPTION" },
  });
  const branch = await prisma.branch.findFirst({
    where: { tenantId: created.tenant.id, isActive: true },
  });
  const department = await prisma.department.findFirst({
    where: { tenantId: created.tenant.id, isActive: true },
  });
  assert(Boolean(receptionRole && branch && department), "Create-user prerequisites exist");

  const receptionUser = await prisma.user.create({
    data: {
      tenantId: created.tenant.id,
      username: `recv.${tenantCode.toLowerCase()}`,
      email: `recv.${tenantCode.toLowerCase()}@uat.test`,
      passwordHash: hashPassword("Reception@2026!"),
      departmentId: department!.id,
      forcePasswordChange: true,
      createdBy: actor,
      updatedBy: actor,
    },
  });
  await prisma.userRole.create({
    data: {
      tenantId: created.tenant.id,
      userId: receptionUser.id,
      roleId: receptionRole!.id,
      isPrimary: true,
      createdBy: actor,
    },
  });
  await prisma.userBranch.create({
    data: {
      tenantId: created.tenant.id,
      userId: receptionUser.id,
      branchId: branch!.id,
      isPrimary: true,
      createdBy: actor,
    },
  });

  const receptionPerms = await getEffectivePermissionsForUser(
    created.tenant.id,
    receptionUser.id,
  );
  assert(
    !(receptionPerms.get("/settings/users")?.canCreate ?? false),
    "Reception cannot create users",
  );

  if (otherTenant?.branches[0] && otherTenant.roles[0]) {
    const foreignBranch = await prisma.branch.findFirst({
      where: { id: otherTenant.branches[0].id, tenantId: created.tenant.id },
    });
    const foreignRole = await prisma.role.findFirst({
      where: { id: otherTenant.roles[0].id, tenantId: created.tenant.id },
    });
    assert(!foreignBranch, "Cross-tenant branch id rejected by tenant scope");
    assert(!foreignRole, "Cross-tenant role id rejected by tenant scope");
  }

  await prisma.user.update({
    where: { id: receptionUser.id },
    data: { userStatus: "INACTIVE", isActive: false, updatedBy: actor },
  });
  const inactive = await prisma.user.findUnique({ where: { id: receptionUser.id } });
  assert(inactive?.userStatus === "INACTIVE", "User deactivate works");

  await prisma.user.update({
    where: { id: receptionUser.id },
    data: {
      passwordHash: hashPassword("Reset@2026!"),
      forcePasswordChange: true,
      userStatus: "ACTIVE",
      isActive: true,
      updatedBy: actor,
    },
  });
  const reactivated = await prisma.user.findUnique({ where: { id: receptionUser.id } });
  assert(reactivated?.userStatus === "ACTIVE", "User reactivate + password reset works");
  assert(
    reactivated?.forcePasswordChange === true,
    "Password reset forces password change without logging plaintext",
  );

  const audit = await prisma.auditLog.findFirst({
    where: {
      tenantId: created.tenant.id,
      entityType: { in: ["TenantAdministratorAccess", "TenantRbacProvision"] },
    },
    orderBy: { createdAt: "desc" },
  });
  assert(Boolean(audit), "Provisioning writes audit history");

  console.log(`TENANT_UNDER_TEST=${created.tenant.tenantCode}`);
  console.log(`ADMIN_USER=${created.admin.username}`);
  console.log("verify-tenant-admin-user-management PASS");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(process.exitCode ?? 0);
  });
