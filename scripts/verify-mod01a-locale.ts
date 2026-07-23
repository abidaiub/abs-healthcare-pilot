/**
 * MOD-01A verification — tenant locale and regional profile foundation.
 * Run: npm run verify:mod01a
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getCountrySuggestion } from "../src/lib/locale/country-defaults";
import {
  resolveTextDirectionForLocale,
  SUPPORTED_LOCALE_REGISTRY,
} from "../src/lib/locale/registry";
import {
  inferLegacyTenantLocaleProfile,
  validateTenantLocaleProfile,
} from "../src/lib/locale/validation";
import {
  ensureAbmgLocaleProfile,
  migrateTenantLocaleProfiles,
} from "../prisma/seed/tenant-locale-migration";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main() {
  const bdSuggestion = getCountrySuggestion("BD");
  assert(Boolean(bdSuggestion), "Bangladesh country suggestion exists");
  assert(bdSuggestion!.defaultLocale === "bn-BD", "Bangladesh primary locale is bn-BD");
  assert(
    bdSuggestion!.supportedLocales.includes("en-BD"),
    "Bangladesh suggestion includes optional English",
  );

  const saSuggestion = getCountrySuggestion("SA");
  assert(saSuggestion!.textDirection === "rtl", "Saudi Arabia suggestion is RTL");
  assert(
    resolveTextDirectionForLocale("ur-PK") === "rtl",
    "Urdu locale resolves RTL direction",
  );

  const override = validateTenantLocaleProfile({
    countryCode: "BD",
    countryName: "Bangladesh",
    defaultLocale: "en-BD",
    supportedLocales: ["en-BD", "bn-BD"],
    timezone: "Asia/Dhaka",
    currencyCode: "BDT",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "en-IN",
    textDirection: "ltr",
  });
  assert(override.ok, "Administrator override of country defaults validates");

  const invalidLocale = validateTenantLocaleProfile({
    countryCode: "BD",
    defaultLocale: "fr-FR",
    supportedLocales: ["fr-FR"],
    timezone: "Asia/Dhaka",
    currencyCode: "BDT",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "en-IN",
    textDirection: "ltr",
  });
  assert(!invalidLocale.ok, "Unsupported locale rejected by registry");

  const defaultNotSupported = validateTenantLocaleProfile({
    countryCode: "IN",
    defaultLocale: "hi-IN",
    supportedLocales: ["en-IN"],
    timezone: "Asia/Kolkata",
    currencyCode: "INR",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "en-IN",
    textDirection: "ltr",
  });
  assert(
    !defaultNotSupported.ok,
    "Default locale must exist within supported locales",
  );

  const emptySupported = validateTenantLocaleProfile({
    countryCode: "US",
    defaultLocale: "en-US",
    supportedLocales: [],
    timezone: "America/New_York",
    currencyCode: "USD",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "en-US",
    textDirection: "ltr",
  });
  assert(!emptySupported.ok, "At least one supported locale is required");

  const registryLanguages = new Set(
    SUPPORTED_LOCALE_REGISTRY.map((entry) => entry.languageCode),
  );
  for (const language of ["bn", "en", "ar", "ur", "hi"]) {
    assert(registryLanguages.has(language), `Application registry includes ${language}`);
  }

  await migrateTenantLocaleProfiles(prisma);

  const abmg = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(abmg), "ABMG tenant exists for migration compatibility");

  if (abmg) {
    await ensureAbmgLocaleProfile(prisma, abmg.id);
    const refreshed = await prisma.tenant.findUnique({ where: { id: abmg.id } });
    assert(refreshed?.countryCode === "BD", "ABMG countryCode migrated");
    assert(refreshed?.defaultLocale === "en-BD", "ABMG defaultLocale preserved from legacy EN");
    assert(
      Array.isArray(refreshed?.supportedLocales),
      "ABMG supportedLocales stored as structured JSON",
    );

    const legacyProfile = inferLegacyTenantLocaleProfile(refreshed!);
    assert(legacyProfile.defaultLocale === "en-BD", "Legacy inference remains stable");

    await migrateTenantLocaleProfiles(prisma);
    const afterSecondPass = await prisma.tenant.findUnique({ where: { id: abmg.id } });
    assert(
      afterSecondPass?.defaultLocale === refreshed?.defaultLocale,
      "Locale migration seed is idempotent",
    );
  }

  const tenants = await prisma.tenant.findMany({ select: { id: true, tenantCode: true } });
  assert(tenants.length > 0, "At least one tenant exists after migration");

  for (const tenant of tenants) {
    const row = await prisma.tenant.findUnique({ where: { id: tenant.id } });
    const validated = validateTenantLocaleProfile(
      inferLegacyTenantLocaleProfile(row!),
    );
    assert(validated.ok, `${tenant.tenantCode} tenant locale profile validates`);
  }

  console.log("\nAll MOD-01A locale profile checks passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
