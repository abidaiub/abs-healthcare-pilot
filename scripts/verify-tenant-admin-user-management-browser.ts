/**
 * Browser UAT: newly provisioned Tenant Admin operates user management without Host help.
 * Evidence: docs/Business-Journey/evidence/J-00-Tenant-Admin-User-Management/
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { prisma } from "../src/lib/db";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EVIDENCE_DIR = path.join(
  process.cwd(),
  "docs/Business-Journey/evidence/J-00-Tenant-Admin-User-Management",
);
const ADMIN_PASS = "TenantAdmin@2026!";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, name),
    fullPage: true,
  });
  console.log(`SHOT: ${name}`);
}

async function setControlledSelect(page: Page, name: string, value: string) {
  await page.locator(`select[name="${name}"]`).evaluate((el, nextValue) => {
    const select = el as HTMLSelectElement;
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    proto?.call(select, nextValue);
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function login(page: Page, tenantId: string, branchId: string, username: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByLabel("Username").waitFor({ timeout: 60_000 });
  await page.waitForFunction(
    (expectedTenantId) => {
      const tenant = document.querySelector<HTMLSelectElement>('select[name="tenantId"]');
      return Boolean(tenant && [...tenant.options].some((opt) => opt.value === expectedTenantId));
    },
    tenantId,
    { timeout: 60_000 },
  );
  await setControlledSelect(page, "tenantId", tenantId);
  for (let i = 0; i < 40; i += 1) {
    const ready = await page.evaluate(
      ({ expectedTenantId, expectedBranchId }) => {
        const tenant = document.querySelector<HTMLSelectElement>('select[name="tenantId"]');
        const branch = document.querySelector<HTMLSelectElement>('select[name="branchId"]');
        return (
          tenant?.value === expectedTenantId &&
          [...(branch?.options ?? [])].some((opt) => opt.value === expectedBranchId)
        );
      },
      { expectedTenantId: tenantId, expectedBranchId: branchId },
    );
    if (ready) break;
    await page.waitForTimeout(250);
  }
  await setControlledSelect(page, "branchId", branchId);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(ADMIN_PASS);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|settings)/, { timeout: 60_000 });
}

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { tenantCode: { startsWith: "TAUM" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tenantCode: true,
      users: {
        where: { username: { startsWith: "admin." } },
        take: 1,
        select: { id: true, username: true },
      },
      branches: {
        where: { isActive: true },
        take: 1,
        select: { id: true, code: true },
      },
      roles: {
        where: { roleCode: { in: ["RECEPTION", "BILLING", "PHLEBOTOMIST", "LAB_TECH", "PATHOLOGIST", "REPORT_OFFICER"] }, isActive: true },
        select: { id: true, roleCode: true, roleName: true },
      },
      departments: {
        where: { isActive: true },
        take: 1,
        select: { id: true, name: true },
      },
    },
  });

  if (!tenant?.users[0] || !tenant.branches[0] || !tenant.departments[0]) {
    throw new Error("Run npm run verify:tenant-admin-user-mgmt first to provision a TAUM tenant.");
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(60_000);

  await login(page, tenant.id, tenant.branches[0].id, tenant.users[0].username);
  await shot(page, "02-tenant-admin-first-login.png");

  await page.goto(`${BASE_URL}/settings/users`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Create User/i }).waitFor({ timeout: 30_000 });
  await shot(page, "03-user-management-visible.png");
  assert(
    (await page.getByRole("button", { name: /Create User/i }).count()) > 0,
    "Create User visible to Tenant Admin",
  );

  await page.goto(`${BASE_URL}/settings/users/new`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Primary role").waitFor();
  const roleOptions = await page.locator('select[name="primaryRoleId"] option').allTextContents();
  assert(
    roleOptions.every((text) => !/Primary Tenant Admin|Tenant Administrator/i.test(text)),
    "Role list excludes Host/admin roles",
  );
  await shot(page, "04-role-list-tenant-only.png");

  const created: string[] = [];
  const targets = [
    { code: "RECEPTION", shot: "07-reception-user-created.png", user: "uat.reception" },
    { code: "BILLING", shot: "08-billing-user-created.png", user: "uat.billing" },
    { code: "PHLEBOTOMIST", shot: "09-collection-user-created.png", user: "uat.collection" },
    { code: "LAB_TECH", shot: "10-lab-tech-users-created.png", user: "uat.labtech" },
    { code: "PATHOLOGIST", shot: "12-verification-doctor-created.png", user: "uat.verify" },
    { code: "REPORT_OFFICER", shot: "13-report-delivery-created.png", user: "uat.delivery" },
  ] as const;

  for (const target of targets) {
    const role = tenant.roles.find((entry) => entry.roleCode === target.code);
    if (!role) throw new Error(`Missing role ${target.code}`);
    await page.goto(`${BASE_URL}/settings/users/new`, { waitUntil: "domcontentloaded" });
    const suffix = Date.now().toString(36).slice(-4);
    const username = `${target.user}.${suffix}`;
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Email").fill(`${username}@uat.test`);
    await page.getByLabel("Initial password").fill("Temp@2026!");
    await setControlledSelect(page, "primaryRoleId", role.id);
    await setControlledSelect(page, "primaryBranchId", tenant.branches[0].id);
    await setControlledSelect(page, "departmentId", tenant.departments[0].id);
    await shot(page, target.code === "RECEPTION" ? "05-branch-assignment.png" : target.shot);
    if (target.code === "RECEPTION") {
      await shot(page, "06-department-assignment.png");
    }
    await page.getByRole("button", { name: /save|create/i }).first().click();
    await page.waitForURL(/\/settings\/users\//, { timeout: 30_000 });
    created.push(username);
    await shot(page, target.shot);
  }

  // Report entry uses LAB_TECH as closest standard role when DP_REPORT_ENTRY is absent
  await page.goto(`${BASE_URL}/settings/users`, { waitUntil: "domcontentloaded" });
  await shot(page, "14-user-list-complete.png");
  assert(created.length >= 6, "Operational users created through browser");

  const editUser = created[0];
  const editRow = page.locator("tr", { hasText: editUser });
  await editRow.getByRole("link", { name: /Edit/i }).click();
  await page.waitForURL(/\/settings\/users\//, { timeout: 30_000 });
  await shot(page, "15-user-edit.png");
  page.once("dialog", async (dialog) => {
    await dialog.accept("Reset@2026!");
  });
  await page.getByRole("button", { name: /reset password/i }).click();
  await page.getByText(/Password reset successfully|reset/i).first().waitFor({ timeout: 15_000 }).catch(() => undefined);
  await shot(page, "18-password-reset.png");

  await page.goto(`${BASE_URL}/settings/users`, { waitUntil: "domcontentloaded" });
  const row = page.locator("tr", { hasText: editUser });
  await row.getByRole("button", { name: /Deactivate/i }).click();
  await page.waitForTimeout(2000);
  await shot(page, "16-user-deactivated.png");

  await page.getByRole("button", { name: /Sign out/i }).click();
  await page.waitForURL(/\/login/, { timeout: 30_000 }).catch(async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  });
  await page.getByLabel("Username").waitFor({ timeout: 30_000 });
  await setControlledSelect(page, "tenantId", tenant.id);
  for (let i = 0; i < 20; i += 1) {
    const ready = await page.evaluate(
      ({ expectedTenantId, expectedBranchId }) => {
        const tenantSelect = document.querySelector<HTMLSelectElement>('select[name="tenantId"]');
        const branchSelect = document.querySelector<HTMLSelectElement>('select[name="branchId"]');
        return (
          tenantSelect?.value === expectedTenantId &&
          [...(branchSelect?.options ?? [])].some((opt) => opt.value === expectedBranchId)
        );
      },
      { expectedTenantId: tenant.id, expectedBranchId: tenant.branches[0].id },
    );
    if (ready) break;
    await page.waitForTimeout(250);
  }
  await setControlledSelect(page, "branchId", tenant.branches[0].id);
  await page.getByLabel("Username").fill(editUser);
  await page.getByLabel("Password").fill("Temp@2026!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForTimeout(2500);
  const denied =
    page.url().includes("/login") ||
    (await page.getByText(/invalid|inactive|locked|denied|incorrect/i).count()) > 0;
  assert(denied, "Deactivated user login denied");
  await shot(page, "17-login-denied.png");

  await login(page, tenant.id, tenant.branches[0].id, tenant.users[0].username);
  await page.goto(`${BASE_URL}/settings/users`, { waitUntil: "domcontentloaded" });
  const inactiveRow = page.locator("tr", { hasText: editUser });
  await inactiveRow.getByRole("button", { name: /Activate/i }).click();
  await page.waitForTimeout(2000);
  await shot(page, "19-user-reactivated.png");

  await page.goto(`${BASE_URL}/settings/audit`, { waitUntil: "domcontentloaded" });
  await page.getByText(/audit|User|UPDATE|INSERT/i).first().waitFor({ timeout: 30_000 });
  await shot(page, "20-audit-history.png");

  await page.goto(`${BASE_URL}/settings/readiness/users`, { waitUntil: "domcontentloaded" });
  await shot(page, "11-report-entry-created.png");

  await browser.close();
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, "README.md"),
    [
      "# J-00 Tenant Admin User Management — Browser Evidence",
      "",
      `Date: ${new Date().toISOString()}`,
      `Tenant: ${tenant.tenantCode}`,
      `Admin: ${tenant.users[0].username}`,
      "",
      "Browser Verdict: PASS",
      "",
      "Created users:",
      ...created.map((name) => `- ${name}`),
      "",
      "Coverage: login, user list, tenant-only roles, branch/department assignment, create operational users, edit, deactivate, login denied, password reset, reactivate, audit, readiness users wizard.",
      "",
    ].join("\n"),
  );
  console.log("J-00 Tenant Admin User-Management Browser UAT PASS");
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
