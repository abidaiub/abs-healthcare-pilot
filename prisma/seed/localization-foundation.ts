import type { PrismaClient } from "../../src/generated/prisma/client";

export async function seedLocalizationFoundation(prisma: PrismaClient) {
  const abmg = await prisma.tenant.findUnique({
    where: { tenantCode: "ABMG" },
    select: { id: true },
  });

  if (abmg) {
    await prisma.tenant.update({
      where: { id: abmg.id },
      data: {
        defaultLocale: "en-BD",
        supportedLocales: ["bn-BD", "en-BD"],
        textDirection: "ltr",
      },
    });
  }

  const demoTenants = await prisma.tenant.findMany({
    where: {
      tenantCode: { in: ["ABS01", "ABS02"] },
    },
    select: { id: true, tenantCode: true },
  });

  for (const tenant of demoTenants) {
    if (tenant.tenantCode === "ABS01") {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          countryCode: "SA",
          country: "Saudi Arabia",
          defaultLocale: "ar-SA",
          supportedLocales: ["ar-SA", "en-BD"],
          timezone: "Asia/Riyadh",
          currencyCode: "SAR",
          textDirection: "rtl",
        },
      });
    }

    if (tenant.tenantCode === "ABS02") {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          countryCode: "IN",
          country: "India",
          defaultLocale: "hi-IN",
          supportedLocales: ["hi-IN", "en-BD"],
          timezone: "Asia/Kolkata",
          currencyCode: "INR",
          textDirection: "ltr",
        },
      });
    }
  }

  console.log("Localization foundation seed ensured representative tenant locale scenarios");
}
