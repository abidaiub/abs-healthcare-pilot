/**
 * MOD-15 browser regression — patient registration hydration + submit stability.
 *
 * Requires: dev or production server at BASE_URL (default http://localhost:3000)
 */
import { chromium, type ConsoleMessage, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TENANT_VALUE = process.env.DPDC_TENANT_ID ?? "cms16sql4001xl4vye09uh9so";
const STAFF_USER = process.env.DPDC_RECEPTION_USER ?? "dp.reception";
const STAFF_PASS = process.env.DPDC_STAFF_PASS ?? "DoctorsPoint@2026!";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function loginReception(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('select').first().selectOption(TENANT_VALUE);
  await page.getByLabel("Username").fill(STAFF_USER);
  await page.getByLabel("Password").fill(STAFF_PASS);
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await page.waitForURL(/\/(dashboard|patients)/);
}

function collectHydrationWarnings(page: Page): string[] {
  const warnings: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    const text = msg.text();
    if (/hydration|did not match|Hydration failed/i.test(text)) {
      warnings.push(text);
    }
  });
  return warnings;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const hydrationWarnings = collectHydrationWarnings(page);

  await loginReception(page);
  await page.goto(`${BASE_URL}/patients/new`);
  await page.waitForLoadState("networkidle");

  assert(
    hydrationWarnings.length === 0,
    `No hydration warnings on first render (found ${hydrationWarnings.length})`,
  );

  await page.getByLabel("First name", { exact: true }).fill("RetainMe");
  await page.getByRole("button", { name: "Save patient" }).click();
  await page.getByText(/required|first name|invalid|error/i).first().waitFor({ timeout: 5_000 }).catch(() => null);
  assert(
    (await page.getByLabel("First name", { exact: true }).inputValue()) === "RetainMe",
    "Validation failure preserves typed first name",
  );

  await page.reload();
  await page.waitForLoadState("networkidle");
  assert(
    hydrationWarnings.length === 0,
    `No hydration warnings after reload (found ${hydrationWarnings.length})`,
  );

  const uniqueMobile = `01712${Date.now().toString().slice(-7)}`;
  const uniqueFirstName = `Jannatul${Date.now().toString().slice(-6)}`;
  await page.getByLabel("First name", { exact: true }).fill(uniqueFirstName);
  await page.getByLabel("Last name", { exact: true }).fill("Ferdous");
  await page.locator('select[name="gender"]').selectOption("FEMALE");
  await page.getByLabel("Date of birth", { exact: true }).fill("1992-03-15");
  await page.getByLabel("Mobile", { exact: true }).fill(uniqueMobile);
  await page.getByLabel("Address line 1", { exact: true }).fill("Borhanuddin");
  await page.getByLabel("City", { exact: true }).fill("Borhanuddin");
  await page.getByLabel("District", { exact: true }).fill("Bhola");

  await page.getByLabel("First name", { exact: true }).click();
  assert(
    (await page.getByLabel("First name", { exact: true }).inputValue()) === uniqueFirstName,
    "First name retained after filling other fields",
  );
  assert(
    (await page.getByLabel("Mobile", { exact: true }).inputValue()) === uniqueMobile,
    "Mobile retained after interaction",
  );

  const saveButton = page.getByRole("button", { name: "Save patient" });
  await saveButton.scrollIntoViewIfNeeded();
  await expectClickable(saveButton);
  await saveButton.click();

  const viewPatientLink = page.locator('main a[href^="/patients/"]:not([href="/patients/new"])').first();
  await viewPatientLink.waitFor({ timeout: 15_000 });
  const successText = await page.locator("body").innerText();
  const patientNumberMatch = successText.match(/PT-\d+/);
  assert(Boolean(patientNumberMatch), "Success screen shows assigned patient number");

  await viewPatientLink.click();
  await page.waitForURL(/\/patients\/(?!new$)[^/]+$/);
  const persistedProfile = await page.locator("main").innerText();
  assert(/1992/.test(persistedProfile), "Date of birth persists after browser registration");

  console.log(`Patient created: ${patientNumberMatch?.[0] ?? "unknown"}`);
  await browser.close();
}

async function expectClickable(locator: ReturnType<Page["getByRole"]>) {
  await locator.waitFor({ state: "visible" });
  assert(await locator.isEnabled(), "Save patient button is enabled");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
