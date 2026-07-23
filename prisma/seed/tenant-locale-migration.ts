import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  inferLegacyTenantLocaleProfile,
  mapLocaleToLegacyLanguage,
} from "../../src/lib/locale/validation";

export async function migrateTenantLocaleProfiles(prisma: PrismaClient) {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      tenantCode: true,
      country: true,
      countryCode: true,
      timezone: true,
      defaultLanguage: true,
      defaultLocale: true,
      supportedLocales: true,
      currencyCode: true,
      dateFormat: true,
      numberFormat: true,
      textDirection: true,
    },
  });

  for (const tenant of tenants) {
    const profile = inferLegacyTenantLocaleProfile(tenant);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        country: profile.countryName,
        countryCode: profile.countryCode,
        defaultLocale: profile.defaultLocale,
        supportedLocales: profile.supportedLocales,
        timezone: profile.timezone,
        currencyCode: profile.currencyCode,
        dateFormat: profile.dateFormat,
        numberFormat: profile.numberFormat,
        textDirection: profile.textDirection,
        defaultLanguage: mapLocaleToLegacyLanguage(profile.defaultLocale),
      },
    });
  }

  console.log(`Tenant locale profiles ensured for ${tenants.length} tenant(s)`);
}

export async function ensureAbmgLocaleProfile(prisma: PrismaClient, tenantId: string) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      country: "Bangladesh",
      countryCode: "BD",
      defaultLocale: "en-BD",
      supportedLocales: ["bn-BD", "en-BD"],
      timezone: "Asia/Dhaka",
      currencyCode: "BDT",
      dateFormat: "DD/MM/YYYY",
      numberFormat: "en-IN",
      textDirection: "ltr",
      defaultLanguage: "EN",
    },
  });
}
