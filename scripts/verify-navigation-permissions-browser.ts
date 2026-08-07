/**
 * Browser UAT for permission-driven tenant sidebar (Doctors / DP_BILLING reproduction + regressions).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { UAT_PASSWORD } from "../prisma/seed/uat/doctors-point-seed";
import { hashPassword } from "../src/lib/password";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EVIDENCE_DIR = path.join(
  process.cwd(),
  "docs/Business-Journey/evidence/Nav-Permission-Sidebar",
);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const UAT_USERNAMES = [
  "dp.billing",
  "dp.tenant.admin",
  "dp.hold.officer",
  "dp.tech.haem",
] as const;

async function ensureUatPasswords(tenantId: string) {
  await prisma.user.updateMany({
    where: {
      tenantId,
      username: { in: [...UAT_USERNAMES] },
    },
    data: {
      passwordHash: hashPassword(UAT_PASSWORD),
      forcePasswordChange: false,
      updatedBy: "verify.navigation-permissions.browser",
    },
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const file = path.join(EVIDENCE_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`SHOT: ${name}`);
}

async function login(
  page: Page,
  username: string,
  password: string,
  tenantId: string,
  branchId: string,
) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 180_000 });
  await page.getByLabel("Username").waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForFunction(
    (expectedTenantId) => {
      const tenant = document.querySelector<HTMLSelectElement>('select[name="tenantId"]');
      return Boolean(tenant && [...tenant.options].some((opt) => opt.value === expectedTenantId));
    },
    tenantId,
    { timeout: 60_000 },
  );
  await page.selectOption('select[name="tenantId"]', tenantId);
  await page.waitForFunction(
    (expectedBranchId) => {
      const branch = document.querySelector<HTMLSelectElement>('select[name="branchId"]');
      return Boolean(branch && [...branch.options].some((opt) => opt.value === expectedBranchId));
    },
    branchId,
    { timeout: 60_000 },
  );
  await page.selectOption('select[name="branchId"]', branchId);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in to workspace/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120_000 });
}

async function logout(page: Page) {
  const signOut = page.getByRole("button", { name: /sign out/i });
  if (await signOut.count()) {
    await signOut.click();
    await page.waitForURL(/\/login/, { timeout: 60_000 }).catch(() => undefined);
  }
  await page.context().clearCookies();
}

async function sidebarHasHref(page: Page, href: string): Promise<boolean> {
  return (await page.locator(`aside nav a[href="${href}"]`).count()) > 0;
}

async function setDoctorPermissionFlags(opts: {
  tenantId: string;
  roleId: string;
  canView: boolean;
  canCreate: boolean;
}) {
  await prisma.permission.updateMany({
    where: {
      tenantId: opts.tenantId,
      roleId: opts.roleId,
      resourceKey: "/settings/doctors",
      isActive: true,
    },
    data: {
      canView: opts.canView,
      canCreate: opts.canCreate,
      updatedBy: "verify.navigation-permissions.browser",
    },
  });
}

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { tenantCode: "DPDC", isActive: true },
    select: {
      id: true,
      branches: {
        where: { code: "BR-BHL-01", isActive: true },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!tenant) throw new Error("DPDC tenant missing");
  const branchId = tenant.branches[0]?.id;
  if (!branchId) throw new Error("DPDC branch BR-BHL-01 missing");

  const billingRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, roleCode: "DP_BILLING", isActive: true },
  });
  if (!billingRole) throw new Error("DP_BILLING role missing");

  const doctorsPerm = await prisma.permission.findFirst({
    where: {
      tenantId: tenant.id,
      roleId: billingRole.id,
      resourceKey: "/settings/doctors",
      isActive: true,
    },
  });
  if (!doctorsPerm) throw new Error("DP_BILLING missing /settings/doctors permission row");

  const original = {
    canView: doctorsPerm.canView,
    canCreate: doctorsPerm.canCreate,
  };

  await ensureUatPasswords(tenant.id);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // Baseline: VIEW + CREATE
    await setDoctorPermissionFlags({
      tenantId: tenant.id,
      roleId: billingRole.id,
      canView: true,
      canCreate: true,
    });

    await login(page, "dp.billing", UAT_PASSWORD, tenant.id, branchId);
    await page.goto(`${BASE_URL}/diagnostic/billing`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    assert(await sidebarHasHref(page, "/settings/doctors"), "dp.billing sidebar shows Doctors");
    assert(
      await sidebarHasHref(page, "/settings/doctor-schedules"),
      "dp.billing sidebar shows Doctor Schedules when VIEW granted",
    );
    await shot(page, "01-dp-billing-sidebar-doctors.png");

    await page.locator('aside nav a[href="/settings/doctors"]').click();
    await page.waitForURL(/\/settings\/doctors/, { timeout: 60_000 });
    assert(page.url().includes("/settings/doctors"), "sidebar opens /settings/doctors");
    assert(
      (await page.getByRole("heading", { name: /Register new doctor/i }).count()) > 0,
      "Add/Register doctor form visible with CREATE",
    );
    await shot(page, "02-dp-billing-doctors-page-create.png");

    // VIEW only — hide create
    await setDoctorPermissionFlags({
      tenantId: tenant.id,
      roleId: billingRole.id,
      canView: true,
      canCreate: false,
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    assert(await sidebarHasHref(page, "/settings/doctors"), "Doctors remains with VIEW only");
    assert(
      (await page.getByRole("heading", { name: /Register new doctor/i }).count()) === 0,
      "Register doctor form hidden without CREATE",
    );
    await shot(page, "03-dp-billing-doctors-view-only.png");

    // No VIEW — menu gone + direct URL denied
    await setDoctorPermissionFlags({
      tenantId: tenant.id,
      roleId: billingRole.id,
      canView: false,
      canCreate: false,
    });
    await page.goto(`${BASE_URL}/diagnostic/billing`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    assert(!(await sidebarHasHref(page, "/settings/doctors")), "Doctors hidden without VIEW");
    await page.goto(`${BASE_URL}/settings/doctors`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    assert(
      page.url().includes("insufficient-permission") || !page.url().includes("/settings/doctors"),
      "direct /settings/doctors denied without VIEW",
    );
    await shot(page, "04-dp-billing-doctors-denied.png");

    // Restore original flags for environment cleanliness
    await setDoctorPermissionFlags({
      tenantId: tenant.id,
      roleId: billingRole.id,
      canView: original.canView,
      canCreate: original.canCreate,
    });

    await logout(page);

    // DP_TENANT_ADMIN regression
    await login(page, "dp.tenant.admin", UAT_PASSWORD, tenant.id, branchId);
    await page.goto(`${BASE_URL}/settings/users`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    assert(await sidebarHasHref(page, "/settings/doctors"), "dp.tenant.admin sees Doctors");
    assert(await sidebarHasHref(page, "/settings/users"), "dp.tenant.admin sees User Management");
    await shot(page, "05-dp-tenant-admin-sidebar.png");
    await logout(page);

    // Unrelated restricted role — Hold Officer should not leak Doctors unless permitted
    await login(page, "dp.hold.officer", UAT_PASSWORD, tenant.id, branchId);
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    }).catch(async () => {
      await page.goto(`${BASE_URL}/lab/report-release`, {
        waitUntil: "domcontentloaded",
        timeout: 180_000,
      });
    });
    const holdDoctors = await sidebarHasHref(page, "/settings/doctors");
    const holdPerm = await prisma.permission.findFirst({
      where: {
        tenantId: tenant.id,
        resourceKey: "/settings/doctors",
        canView: true,
        isActive: true,
        role: {
          roleCode: "DP_HOLD_OFFICER",
          isActive: true,
        },
      },
    });
    assert(
      holdDoctors === Boolean(holdPerm),
      holdPerm
        ? "dp.hold.officer Doctors visible (role has VIEW)"
        : "dp.hold.officer Doctors not leaked",
    );
    await shot(page, "06-dp-hold-officer-sidebar.png");
    await logout(page);

    // Lab tech regression
    await login(page, "dp.tech.haem", UAT_PASSWORD, tenant.id, branchId);
    await page.goto(`${BASE_URL}/lab/orders`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    assert(await sidebarHasHref(page, "/lab/orders"), "lab tech sees Lab Orders");
    assert(
      await sidebarHasHref(page, "/lab/result-entry"),
      "lab tech sees Manual Result Entry",
    );
    const techDoctors = await sidebarHasHref(page, "/settings/doctors");
    const techDoctorsPerm = await prisma.permission.findFirst({
      where: {
        tenantId: tenant.id,
        resourceKey: "/settings/doctors",
        canView: true,
        isActive: true,
        role: { roleCode: "DP_TECH_HAEM", isActive: true },
      },
    });
    assert(
      techDoctors === Boolean(techDoctorsPerm),
      "lab tech Doctors visibility matches permission",
    );
    await shot(page, "07-dp-tech-haem-sidebar.png");

    console.log(`\nEvidence: ${EVIDENCE_DIR}`);
    console.log("BROWSER UAT PASS");
  } finally {
    await setDoctorPermissionFlags({
      tenantId: tenant.id,
      roleId: billingRole.id,
      canView: original.canView,
      canCreate: original.canCreate,
    }).catch(() => undefined);
    await browser.close();
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect().catch(() => undefined);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
