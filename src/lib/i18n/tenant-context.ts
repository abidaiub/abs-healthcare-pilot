import type { TenantLocaleSettings } from "@/lib/i18n/types";
import { prisma } from "@/lib/db";
import { parseStoredSupportedLocales } from "@/lib/locale/validation";

export async function getTenantLocaleSettings(
  tenantId: string,
): Promise<TenantLocaleSettings | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      defaultLocale: true,
      supportedLocales: true,
      timezone: true,
      currencyCode: true,
      dateFormat: true,
      numberFormat: true,
      textDirection: true,
    },
  });

  if (!tenant) return null;

  return {
    tenantId: tenant.id,
    defaultLocale: tenant.defaultLocale,
    supportedLocales: parseStoredSupportedLocales(tenant.supportedLocales),
    timezone: tenant.timezone,
    currencyCode: tenant.currencyCode,
    dateFormat: tenant.dateFormat,
    numberFormat: tenant.numberFormat,
    textDirection: tenant.textDirection === "rtl" ? "rtl" : "ltr",
  };
}
