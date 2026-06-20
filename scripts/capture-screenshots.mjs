import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = "http://localhost:3000";
const outDir = path.resolve("screenshots");

async function login(page) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Username").fill("reception_01");
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await page.waitForURL(`${baseUrl}/dashboard`);
}

async function capture() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${baseUrl}/login`);
  await page.screenshot({
    path: path.join(outDir, "01-tenant-login.png"),
    fullPage: true,
  });

  await login(page);
  await page.screenshot({
    path: path.join(outDir, "02-diagnostic-dashboard.png"),
    fullPage: true,
  });

  await page.goto(`${baseUrl}/diagnostic/billing`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: path.join(outDir, "03-diagnostic-billing.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "Generate order & receipt" }).click();
  await page.getByText("Investigation order & money receipt").waitFor();
  await page.screenshot({
    path: path.join(outDir, "04-diagnostic-billing-receipt.png"),
    fullPage: true,
  });

  await browser.close();
  console.log(`Screenshots saved to ${outDir}`);
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
