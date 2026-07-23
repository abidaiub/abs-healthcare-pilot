/**
 * MOD-06 verification — tenant-aware localization engine.
 * Run: npm run verify:mod06
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  APP_FALLBACK_LOCALE,
  MOD06_PRIMARY_LOCALES,
  REQUIRED_MESSAGE_NAMESPACES,
} from "../src/lib/i18n/constants";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import {
  formatTenantCurrency,
  formatTenantDate,
  formatTenantNumber,
} from "../src/lib/i18n/format";
import { listMessageLocales } from "../src/lib/i18n/messages";
import {
  assertLocaleAllowedForTenant,
  resolveLocale,
} from "../src/lib/i18n/resolve";
import { getTenantLocaleSettings } from "../src/lib/i18n/tenant-context";
import { validateMod06RegistryCompliance } from "../src/lib/module-governance-validate";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main() {
  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(
      fs.existsSync(path.join("src/messages", locale)),
      `Message directory exists for ${locale}`,
    );
  }

  for (const locale of MOD06_PRIMARY_LOCALES) {
    for (const namespace of REQUIRED_MESSAGE_NAMESPACES) {
      assert(
        fs.existsSync(path.join("src/messages", locale, `${namespace}.json`)),
        `${locale}/${namespace}.json exists`,
      );
    }
  }

  const completeness = compareLocaleMessageStructure();
  assert(completeness.ok, "Required translation key structure matches across locales");
  for (const report of completeness.reports) {
    if (!report.ok) {
      throw new Error(
        `${report.locale} missing keys: ${report.missingKeys.slice(0, 5).join(", ")}`,
      );
    }
  }

  assert(
    fs.existsSync("src/components/layout/LanguageSwitcher.tsx"),
    "Language switcher component exists",
  );
  assert(fs.existsSync("src/lib/i18n/server.ts"), "Server i18n resolver exists");
  assert(fs.existsSync("src/lib/i18n/format.ts"), "Central formatting utilities exist");
  assert(
    fs.existsSync("docs/modules/MOD-06-Localization.md"),
    "MOD-06 specification exists",
  );

  const tenantDefault = resolveLocale({
    tenantSettings: {
      tenantId: "demo",
      defaultLocale: "bn-BD",
      supportedLocales: ["bn-BD", "en-BD"],
      timezone: "Asia/Dhaka",
      currencyCode: "BDT",
      dateFormat: "DD/MM/YYYY",
      numberFormat: "en-IN",
      textDirection: "ltr",
    },
  });
  assert(tenantDefault.locale === "bn-BD", "Tenant default locale resolves when no preference");

  const userOverride = resolveLocale({
    userPreferredLocale: "en-BD",
    tenantSettings: {
      tenantId: "demo",
      defaultLocale: "bn-BD",
      supportedLocales: ["bn-BD", "en-BD"],
      timezone: "Asia/Dhaka",
      currencyCode: "BDT",
      dateFormat: "DD/MM/YYYY",
      numberFormat: "en-IN",
      textDirection: "ltr",
    },
  });
  assert(userOverride.locale === "en-BD", "User preference overrides tenant default");
  assert(userOverride.source === "user", "User preference source recorded");

  const invalid = resolveLocale({
    cookieLocale: "fr-FR",
    tenantSettings: {
      tenantId: "demo",
      defaultLocale: "bn-BD",
      supportedLocales: ["bn-BD", "en-BD"],
      timezone: "Asia/Dhaka",
      currencyCode: "BDT",
      dateFormat: "DD/MM/YYYY",
      numberFormat: "en-IN",
      textDirection: "ltr",
    },
  });
  assert(invalid.locale === "bn-BD", "Invalid cookie locale falls back safely");

  const disallowed = resolveLocale({
    userPreferredLocale: "hi-IN",
    tenantSettings: {
      tenantId: "demo",
      defaultLocale: "bn-BD",
      supportedLocales: ["bn-BD", "en-BD"],
      timezone: "Asia/Dhaka",
      currencyCode: "BDT",
      dateFormat: "DD/MM/YYYY",
      numberFormat: "en-IN",
      textDirection: "ltr",
    },
  });
  assert(disallowed.locale === "bn-BD", "Locale not enabled for tenant is rejected");

  assert(
    resolveTextDirectionForLocale("ar-SA") === "rtl",
    "Arabic locale maps to RTL direction",
  );
  assert(
    resolveTextDirectionForLocale("ur-PK") === "rtl",
    "Urdu locale maps to RTL direction",
  );
  assert(
    resolveTextDirectionForLocale("hi-IN") === "ltr",
    "Hindi locale remains LTR",
  );

  const abmg = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(abmg), "ABMG tenant exists for MOD-01A integration");
  if (abmg) {
    const settings = await getTenantLocaleSettings(abmg.id);
    assert(Boolean(settings), "ABMG tenant locale settings load");
    assert(
      settings!.supportedLocales.includes(settings!.defaultLocale),
      "ABMG default locale is within supported locales",
    );
    assert(
      assertLocaleAllowedForTenant("bn-BD", settings),
      "Bangla allowed for ABMG tenant",
    );
    assert(
      !assertLocaleAllowedForTenant("ar-SA", settings),
      "Arabic blocked when not enabled for ABMG tenant",
    );
  }

  const admin = await prisma.user.findUnique({ where: { username: "laila.hasan" } });
  assert(
    Boolean(admin && "preferredLocale" in admin),
    "User model includes preferredLocale field",
  );

  const formattedDate = formatTenantDate("2026-07-23", settingsFromAbmg(abmg), "en-BD");
  assert(formattedDate.includes("2026"), "Tenant date formatting returns display value");

  const formattedCurrency = formatTenantCurrency(1500, settingsFromAbmg(abmg), "en-BD");
  assert(formattedCurrency.length > 0, "Tenant currency formatting works");

  const formattedNumber = formatTenantNumber(1234567.89, settingsFromAbmg(abmg), "en-BD");
  assert(formattedNumber.includes("1"), "Tenant number formatting works");

  assert(listMessageLocales().length >= MOD06_PRIMARY_LOCALES.length, "Message locales discovered");
  assert(APP_FALLBACK_LOCALE === "en-BD", "Application fallback locale is en-BD");

  const registryCompliance = validateMod06RegistryCompliance();
  assert(registryCompliance.ok, "MOD-06 module registry metadata is complete");
  if (!registryCompliance.ok) {
    throw new Error(registryCompliance.errors.join("; "));
  }

  const dbMod06 = await prisma.moduleRegistry.findUnique({
    where: { moduleCode: "MOD-06" },
  });
  assert(Boolean(dbMod06?.isActive), "MOD-06 exists in database module_registry after seed");

  console.log("\nAll MOD-06 localization checks passed.");
}

function settingsFromAbmg(
  tenant: { timezone: string; currencyCode: string; dateFormat: string; numberFormat: string; textDirection: string } | null,
) {
  if (!tenant) return null;
  return {
    tenantId: "abmg",
    defaultLocale: "en-BD",
    supportedLocales: ["bn-BD", "en-BD"],
    timezone: tenant.timezone,
    currencyCode: tenant.currencyCode,
    dateFormat: tenant.dateFormat,
    numberFormat: tenant.numberFormat,
    textDirection: tenant.textDirection === "rtl" ? ("rtl" as const) : ("ltr" as const),
  };
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
