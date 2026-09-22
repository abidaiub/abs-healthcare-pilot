import dotenv from "dotenv";
async function main() {
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local", quiet: true });
const { provisionTenant } = await import("../src/services/identity");

const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (!password) throw new Error("Set BOOTSTRAP_ADMIN_PASSWORD; no default credential is provided");
const result = await provisionTenant({
  tenantCode: process.env.BOOTSTRAP_TENANT_CODE ?? "LABDEMO",
  tenantName: process.env.BOOTSTRAP_TENANT_NAME ?? "ABS Lab Lite Demo",
  branchCode: process.env.BOOTSTRAP_BRANCH_CODE ?? "MAIN",
  branchName: process.env.BOOTSTRAP_BRANCH_NAME ?? "Main Lab",
  username: process.env.BOOTSTRAP_ADMIN_USERNAME ?? "labadmin",
  displayName: process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME ?? "Lab Administrator",
  password,
});
process.stdout.write(`Provisioned tenant ${result.tenantId} and branch ${result.branchId}. The password was not printed.\n`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
