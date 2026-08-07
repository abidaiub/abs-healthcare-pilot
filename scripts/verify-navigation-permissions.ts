/**
 * Consistency verifier: tenant sidebar is driven by effective VIEW permissions
 * against the permission registry — not role-name allowlists.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  canViewNavHref,
  filterNavGroupsByViewAccess,
  getTenantNavGroupsFromPermissions,
  listTenantNavHrefs,
  resolveNavResourceKey,
  TENANT_NAV_CATALOG,
  type NavGroup,
} from "../src/lib/navigation";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";
import {
  emptyEffectivePermission,
  mergePermissionRows,
} from "../src/lib/rbac/permissions";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";
import type { EffectivePermission } from "../src/lib/rbac/types";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function record(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
}

function flattenHrefs(groups: NavGroup[]): string[] {
  return groups.flatMap((g) => g.items.map((i) => i.href)).sort();
}

function permsFromKeys(
  entries: Array<{ resourceKey: string; canView?: boolean; canCreate?: boolean }>,
): Map<string, EffectivePermission> {
  return mergePermissionRows(
    entries.map((entry) => ({
      resourceKey: entry.resourceKey,
      canView: entry.canView ?? false,
      canCreate: entry.canCreate ?? false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canPrint: false,
    })),
  );
}

function printAuditMatrix() {
  console.log("\n=== Permission-to-navigation audit matrix ===");
  console.log(
    [
      "route",
      "permission_resource",
      "required_action",
      "nav_item",
      "parent_group",
      "result",
    ].join(" | "),
  );

  for (const group of TENANT_NAV_CATALOG) {
    for (const item of group.items) {
      const resourceKey = resolveNavResourceKey(item.href);
      const registry = TENANT_PERMISSION_RESOURCES.find(
        (r) => r.resourceKey === resourceKey,
      );
      const routeOk = registry?.route === item.href;
      const result = !resourceKey
        ? "FAIL unknown resource"
        : !routeOk
          ? "FAIL route mismatch"
          : "OK";
      console.log(
        [
          item.href,
          resourceKey ?? "(none)",
          "canView",
          item.labelKey,
          group.titleKey,
          result,
        ].join(" | "),
      );
    }
  }
}

async function assertRoleNavConsistency(
  tenantId: string,
  roleCode: string,
  usernameHint?: string,
) {
  const role = await prisma.role.findFirst({
    where: { tenantId, roleCode, isActive: true },
    include: { permissions: { where: { isActive: true } } },
  });
  if (!role) {
    record(`Role ${roleCode} exists`, false);
    return;
  }
  record(`Role ${roleCode} exists`, true);

  const user =
    (usernameHint
      ? await prisma.user.findFirst({
          where: { tenantId, username: usernameHint, isActive: true },
        })
      : null) ??
    (await prisma.user.findFirst({
      where: {
        tenantId,
        isActive: true,
        userRoles: { some: { isActive: true, roleId: role.id } },
      },
    }));

  if (!user) {
    record(`${roleCode} has assigned user`, false);
    return;
  }
  record(`${roleCode} user`, true, user.username);

  const permissions = await getEffectivePermissionsForUser(tenantId, user.id);
  const nav = getTenantNavGroupsFromPermissions(permissions);
  const visible = new Set(flattenHrefs(nav));

  for (const href of listTenantNavHrefs()) {
    const expected = canViewNavHref(permissions, href);
    const actual = visible.has(href);
    record(
      `${roleCode} nav ${href}`,
      expected === actual,
      expected ? "visible" : "hidden",
    );
  }

  const emptyParents = nav.filter((g) => g.items.length === 0);
  record(`${roleCode} no empty parents`, emptyParents.length === 0);

  const unauthorizedVisible = flattenHrefs(nav).filter(
    (href) => !canViewNavHref(permissions, href),
  );
  record(
    `${roleCode} no unauthorized children`,
    unauthorizedVisible.length === 0,
    unauthorizedVisible.join(",") || "none",
  );

  // CREATE alone must not reveal Doctors
  const createOnly = permsFromKeys([
    { resourceKey: "/settings/doctors", canCreate: true },
  ]);
  const createOnlyNav = getTenantNavGroupsFromPermissions(createOnly);
  record(
    `${roleCode} synthetic: CREATE-only hides Doctors`,
    !flattenHrefs(createOnlyNav).includes("/settings/doctors"),
  );
}

async function main() {
  printAuditMatrix();

  // Catalog ↔ registry consistency
  const unknown: string[] = [];
  const mismatched: string[] = [];
  const seen = new Set<string>();
  for (const group of TENANT_NAV_CATALOG) {
    for (const item of group.items) {
      if (seen.has(item.href)) {
        record(`Unique nav href ${item.href}`, false, "duplicate in catalog");
      }
      seen.add(item.href);
      const key = resolveNavResourceKey(item.href);
      if (!key) {
        unknown.push(item.href);
        continue;
      }
      const registry = TENANT_PERMISSION_RESOURCES.find((r) => r.resourceKey === key);
      if (!registry || registry.route !== item.href) {
        mismatched.push(item.href);
      }
    }
  }
  record("All nav items map to registry resources", unknown.length === 0, unknown.join(",") || "ok");
  record(
    "Nav routes match registry routes",
    mismatched.length === 0,
    mismatched.join(",") || "ok",
  );

  // Unit: VIEW shows Doctors + parent; CREATE-only hides; empty parent removed
  const doctorsView = permsFromKeys([
    { resourceKey: "/settings/doctors", canView: true },
  ]);
  const doctorsNav = getTenantNavGroupsFromPermissions(doctorsView);
  record(
    "VIEW Doctors shows leaf",
    flattenHrefs(doctorsNav).includes("/settings/doctors"),
  );
  record(
    "VIEW Doctors shows Diagnostic Setup parent",
    doctorsNav.some((g) => g.titleKey === "groups.diagnosticSetup"),
  );
  record(
    "VIEW Doctors does not show unrelated billing leaf",
    !flattenHrefs(doctorsNav).includes("/diagnostic/billing"),
  );

  const schedulesOnly = permsFromKeys([
    { resourceKey: "/settings/doctor-schedules", canView: true },
  ]);
  const schedulesNav = getTenantNavGroupsFromPermissions(schedulesOnly);
  record(
    "Doctor Schedule VIEW shows schedules only (not Doctors)",
    flattenHrefs(schedulesNav).includes("/settings/doctor-schedules") &&
      !flattenHrefs(schedulesNav).includes("/settings/doctors"),
  );

  const empty = filterNavGroupsByViewAccess(TENANT_NAV_CATALOG, new Map());
  record("No permissions → empty nav", empty.length === 0);

  // VIEW-authorized navigable route must be reachable
  for (const href of listTenantNavHrefs()) {
    const key = resolveNavResourceKey(href);
    if (!key) continue;
    const map = new Map([[key, { ...emptyEffectivePermission(key), canView: true }]]);
    const nav = getTenantNavGroupsFromPermissions(map);
    record(
      `VIEW ${href} reachable in nav`,
      flattenHrefs(nav).includes(href),
    );
  }

  const tenant = await prisma.tenant.findFirst({
    where: { tenantCode: "DPDC", isActive: true },
  });
  record("DPDC tenant exists", Boolean(tenant));
  if (!tenant) {
    finish();
    return;
  }

  const roleCases: Array<{ roleCode: string; username?: string }> = [
    { roleCode: "DP_TENANT_ADMIN", username: "dp.tenant.admin" },
    { roleCode: "DP_BILLING", username: "dp.billing" },
    { roleCode: "DP_TECH_HAEM", username: "dp.tech.haem" },
    { roleCode: "DP_REPORT_ENTRY", username: "dp.report.entry" },
    { roleCode: "DP_HOLD_OFFICER", username: "dp.hold.officer" },
    { roleCode: "DP_RECEPTION", username: "dp.reception" },
  ];

  for (const roleCase of roleCases) {
    await assertRoleNavConsistency(tenant.id, roleCase.roleCode, roleCase.username);
  }

  // Multi-role: if any user has >1 active role, verify merge
  const multiRoleUser = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      isActive: true,
      userRoles: { some: { isActive: true } },
    },
    include: {
      userRoles: {
        where: { isActive: true },
        include: { role: true },
      },
    },
  });
  // Prefer a user that already has multiple roles; otherwise skip with note
  const multi = await prisma.user.findMany({
    where: { tenantId: tenant.id, isActive: true },
    include: {
      userRoles: { where: { isActive: true }, include: { role: true } },
    },
  });
  const multiHit = multi.find((u) => u.userRoles.length > 1);
  if (multiHit) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, multiHit.id);
    const nav = getTenantNavGroupsFromPermissions(permissions);
    const unauthorized = flattenHrefs(nav).filter((h) => !canViewNavHref(permissions, h));
    record(
      `Multi-role user ${multiHit.username} nav consistent`,
      unauthorized.length === 0,
      multiHit.userRoles.map((r) => r.role.roleCode).join("+"),
    );
  } else {
    record("Multi-role user available", true, "none in seed — skipped merge leakage check");
  }

  // Reproduction: dp.billing + Doctors VIEW ⇒ Doctors in nav
  const billing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, username: "dp.billing" },
  });
  if (billing) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, billing.id);
    const doctorsPerm = permissions.get("/settings/doctors");
    record(
      "dp.billing has Doctors VIEW (seed/config)",
      Boolean(doctorsPerm?.canView),
      doctorsPerm
        ? `view=${doctorsPerm.canView},create=${doctorsPerm.canCreate}`
        : "missing",
    );
    const nav = getTenantNavGroupsFromPermissions(permissions);
    record(
      "dp.billing Doctors visible in sidebar filter",
      flattenHrefs(nav).includes("/settings/doctors"),
    );
    record(
      "dp.billing Diagnostic Setup parent visible when Doctors authorized",
      !doctorsPerm?.canView ||
        nav.some((g) => g.titleKey === "groups.diagnosticSetup"),
    );
  }

  void multiRoleUser;
  finish();
}

function finish() {
  const failed = checks.filter((c) => !c.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  void prisma.$disconnect().then(() => pool.end());
  if (failed.length) {
    console.error("FAILED:", failed.map((f) => f.name).join("; "));
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
