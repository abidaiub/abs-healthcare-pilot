/**
 * MOD-00 / J-00 browser UAT — Tenant Go-Live Wizard.
 * Captures screenshots under docs/Business-Journey/evidence/J-00/
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { prisma } from "../src/lib/db";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const STAFF_USER = process.env.DPDC_ADMIN_USER ?? "dp.tenant.admin";
const STAFF_PASS = process.env.DPDC_STAFF_PASS ?? "DoctorsPoint@2026!";
const EVIDENCE_DIR = path.join(
  process.cwd(),
  "docs/Business-Journey/evidence/J-00",
);

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

async function loginAdmin(page: Page, tenantId: string, branchId: string) {
  page.setDefaultTimeout(90_000);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByLabel("Username").waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForFunction(
    (expectedTenantId) => {
      const tenant = document.querySelector<HTMLSelectElement>('select[name="tenantId"]');
      return Boolean(tenant && [...tenant.options].some((opt) => opt.value === expectedTenantId));
    },
    tenantId,
    { timeout: 60_000 },
  );

  await page.locator('select[name="tenantId"]').evaluate((el, value) => {
    const select = el as HTMLSelectElement;
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    proto?.call(select, value);
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, tenantId);

  // Poll with evaluate — more reliable than waitForFunction arg serialization here.
  let ready = false;
  for (let i = 0; i < 40; i += 1) {
    const state = await page.evaluate(
      ({ expectedTenantId, expectedBranchId }) => {
        const tenant = document.querySelector<HTMLSelectElement>('select[name="tenantId"]');
        const branch = document.querySelector<HTMLSelectElement>('select[name="branchId"]');
        return {
          tenantValue: tenant?.value ?? null,
          branchValues: [...(branch?.options ?? [])].map((o) => o.value),
          ok:
            tenant?.value === expectedTenantId &&
            [...(branch?.options ?? [])].some((o) => o.value === expectedBranchId),
        };
      },
      { expectedTenantId: tenantId, expectedBranchId: branchId },
    );
    if (state.ok) {
      ready = true;
      break;
    }
    if (i === 0 || i === 39) {
      console.log("LOGIN_SELECT_STATE", i, state, { tenantId, branchId });
    }
    await page.waitForTimeout(250);
  }
  if (!ready) {
    throw new Error("Failed to select DPDC tenant/branch on login form");
  }

  await page.locator('select[name="branchId"]').evaluate((el, value) => {
    const select = el as HTMLSelectElement;
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    proto?.call(select, value);
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, branchId);

  await page.getByLabel("Username").fill(STAFF_USER);
  await page.getByLabel("Password").fill(STAFF_PASS);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|settings)/, { timeout: 60_000 });
}

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { tenantCode: "DPDC" },
    select: {
      id: true,
      branches: {
        where: { code: "BR-BHL-01" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!tenant) throw new Error("DPDC tenant missing");
  const branchId = tenant.branches[0]?.id;
  if (!branchId) throw new Error("DPDC branch BR-BHL-01 missing");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await loginAdmin(page, tenant.id, branchId);
  await shot(page, "01-tenant-admin-login-dashboard.png");

  await page.goto(`${BASE_URL}/settings/readiness`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.getByText(/Overall Readiness Score/i).waitFor({ timeout: 60_000 });
  await shot(page, "16-readiness-dashboard-before.png");
  assert(
    (await page.getByText(/Overall Readiness Score/i).count()) > 0,
    "Readiness dashboard renders",
  );

  // Company profile
  await page.goto(`${BASE_URL}/settings/readiness/company`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.getByLabel("Company name").waitFor({ timeout: 60_000 });
  await page.getByLabel("Company name").fill("Doctors Point Diagnostic Center");
  await page.getByLabel("Phone").fill("+880 1712 100000");
  await page.getByLabel("Email").fill("admin@doctorspoint.test");
  await page.getByLabel("Website").fill("https://doctorspoint.test");
  await page.getByLabel("Address").fill("Bhola Sadar, Bhola, Bangladesh");
  await page.getByLabel("Tenant logo URL").fill("/branding/dpdc-logo.png");
  await page
    .getByLabel("Header branding / report header logo URL")
    .fill("Doctors Point Diagnostic Center");
  await page
    .getByLabel("Invoice footer")
    .fill("Thank you for choosing Doctors Point. This is a computer-generated invoice.");
  await page
    .getByLabel("Report footer")
    .fill("Validated laboratory report · Doctors Point Diagnostic Center");
  await page.getByLabel("Footer branding").fill("Doctors Point · Quality Diagnostics");
  await page.getByLabel("Barcode prefix").fill("DPDC");
  await page.getByRole("button", { name: /Save company profile/i }).click();
  await page.getByText(/Company profile saved/i).waitFor({ timeout: 10_000 });
  await shot(page, "17-company-profile.png");

  // Departments
  await page.goto(`${BASE_URL}/settings/readiness/departments`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.getByRole("button", { name: /Add missing suggested departments/i }).waitFor();
  await page.getByRole("button", { name: /Add missing suggested departments/i }).click();
  await page.getByText(/Ensured suggested departments/i).waitFor({ timeout: 15_000 });
  await shot(page, "18-departments.png");

  // Users / Doctors / Catalog / Ranges review
  await page.goto(`${BASE_URL}/settings/readiness/users`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByText(/Operational User Wizard/i).first().waitFor();
  await shot(page, "19-operational-users.png");

  await page.goto(`${BASE_URL}/settings/readiness/doctors`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByText(/Doctor Setup/i).first().waitFor();
  await shot(page, "20-doctors-readiness.png");

  await page.goto(`${BASE_URL}/settings/readiness/catalog`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByText(/Catalog Readiness/i).first().waitFor();
  await shot(page, "21-catalog-readiness.png");

  await page.goto(`${BASE_URL}/settings/readiness/reference-ranges`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByText(/Reference Range Readiness/i).first().waitFor();
  await shot(page, "22-reference-ranges.png");

  await page.goto(`${BASE_URL}/settings/readiness/analyzers`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByText(/Analyzer Readiness/i).first().waitFor();
  await shot(page, "23-analyzers-readiness.png");

  // LIS configure + test first analyzer
  await page.goto(`${BASE_URL}/settings/readiness/lis`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByText(/LIS Readiness/i).first().waitFor();
  const endpoints = page.getByLabel("LIS endpoint");
  const count = await endpoints.count();
  assert(count > 0, "LIS analyzers listed");
  for (let i = 0; i < count; i += 1) {
    await endpoints.nth(i).fill(`sim://dpdc-analyzer-${i + 1}`);
  }
  const testButtons = page.getByRole("button", { name: /Import \/ connection test/i });
  const testCount = await testButtons.count();
  for (let i = 0; i < testCount; i += 1) {
    await testButtons.nth(i).click();
    await page.getByText(/Import\/connection test OK/i).waitFor({ timeout: 10_000 });
  }
  await shot(page, "24-lis-readiness.png");

  // Portal settings
  await page.goto(`${BASE_URL}/settings/readiness/portal`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByRole("button", { name: /Save portal settings/i }).waitFor();
  const checkboxes = page.locator('input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();
  for (let i = 0; i < checkboxCount; i += 1) {
    const box = checkboxes.nth(i);
    if (!(await box.isChecked())) await box.check();
  }
  // keep self-registration off for safer go-live
  const selfReg = page.getByText("Self registration").locator("xpath=ancestor::label[1]").locator('input[type="checkbox"]');
  if (await selfReg.count()) {
    if (await selfReg.isChecked()) await selfReg.uncheck();
  }
  await page.getByRole("button", { name: /Save portal settings/i }).click();
  await page.getByText(/Portal readiness settings saved/i).waitFor({ timeout: 15_000 });
  await shot(page, "25-portal-readiness.png");

  // Final readiness + declare
  await page.goto(`${BASE_URL}/settings/readiness`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByText(/Overall Readiness Score/i).waitFor({ timeout: 60_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText(/Overall Readiness Score/i).waitFor({ timeout: 60_000 });

  const body = await page.locator("main").innerText();
  assert(/100%/.test(body), "Operational readiness shows 100%");
  assert(/READY FOR FIRST PATIENT/i.test(body), "READY FOR FIRST PATIENT visible");

  const declareBtn = page.getByRole("button", { name: /^READY FOR FIRST PATIENT$/i });
  await declareBtn.waitFor({ state: "visible" });
  assert(await declareBtn.isEnabled(), "Declare ready button enabled");
  const alreadyDeclared = /Declared ready/i.test(body);
  if (!alreadyDeclared) {
    await declareBtn.click();
    await page.getByText(/READY FOR FIRST PATIENT declared/i).waitFor({ timeout: 15_000 });
  } else {
    await declareBtn.click();
    await page
      .getByText(/READY FOR FIRST PATIENT declared|Declared ready/i)
      .first()
      .waitFor({ timeout: 15_000 });
  }
  await shot(page, "26-readiness-dashboard-ready.png");

  const finalBody = await page.locator("main").innerText();
  assert(/Declared ready/i.test(finalBody), "Declared ready confirmation shown");

  await browser.close();
  console.log("J-00 Browser UAT PASS");
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
