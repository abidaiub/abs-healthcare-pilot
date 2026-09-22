import dotenv from "dotenv";
async function main() {
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local", quiet: true });
const { upsertCatalogRelease, upsertGlobalTemplate } = await import("../src/services/catalog");
const { loadMasterCatalog } = await import("./catalog-master");
const catalog = await loadMasterCatalog();
await upsertCatalogRelease(catalog.release);
for (const template of catalog.templates) await upsertGlobalTemplate(template);
process.stdout.write(`Seeded master catalog ${catalog.release.releaseCode}: ${catalog.templates.length} disabled-by-default templates. No prices, result defaults, or clinical reference ranges were created.\n`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
