import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  mapLocaleToLegacyLanguage,
  parseStoredSupportedLocales,
  validateTenantLocaleProfile,
} from "@/lib/locale/validation";
import { writeAuditLog } from "@/lib/saas/audit";
import { getTenantSettingsPayload } from "@/lib/saas/queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_FIELDS = new Set([
  "logoUrl",
  "reportHeaderLogoUrl",
  "reportFooterText",
  "defaultLanguage",
  "defaultLocale",
  "supportedLocales",
  "countryCode",
  "country",
  "currencyCode",
  "dateFormat",
  "numberFormat",
  "textDirection",
  "timezone",
  "contactPerson",
  "contactMobile",
  "contactEmail",
  "address",
  "city",
  "district",
]);

async function authorizeTenantAccess(tenantId: string) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.loginKind === "host") {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    }
    return { session, tenantId, isHost: true as const };
  }

  if (session.loginKind !== "tenant" || session.tenantId !== tenantId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session, tenantId, isHost: false as const };
}

function parsePatchValue(key: string, value: unknown): unknown {
  if (key === "supportedLocales") {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        return null;
      }
    }
    return null;
  }

  return value === null || value === undefined
    ? null
    : String(value).trim() || null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await authorizeTenantAccess(id);
  if ("error" in auth && auth.error) return auth.error;

  const settings = await getTenantSettingsPayload(id);
  if (!settings) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await authorizeTenantAccess(id);
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    data[key] = parsePatchValue(key, value);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const localePatch = validateTenantLocaleProfile({
    countryCode: String(data.countryCode ?? existing.countryCode),
    countryName: String(data.country ?? existing.country),
    defaultLocale: String(data.defaultLocale ?? existing.defaultLocale),
    supportedLocales: Array.isArray(data.supportedLocales)
      ? (data.supportedLocales as string[])
      : parseStoredSupportedLocales(existing.supportedLocales),
    timezone: String(data.timezone ?? existing.timezone),
    currencyCode: String(data.currencyCode ?? existing.currencyCode),
    dateFormat: String(data.dateFormat ?? existing.dateFormat),
    numberFormat: String(data.numberFormat ?? existing.numberFormat),
    textDirection:
      String(data.textDirection ?? existing.textDirection).toLowerCase() === "rtl"
        ? "rtl"
        : "ltr",
  });

  if (
    "defaultLocale" in data ||
    "supportedLocales" in data ||
    "countryCode" in data ||
    "currencyCode" in data ||
    "dateFormat" in data ||
    "numberFormat" in data ||
    "textDirection" in data ||
    "timezone" in data
  ) {
    if (!localePatch.ok) {
      return NextResponse.json({ error: localePatch.error }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {
    updatedBy: auth.session!.user.name,
  };

  for (const [key, value] of Object.entries(data)) {
    if (key === "supportedLocales" && Array.isArray(value)) {
      updateData.supportedLocales = value;
      continue;
    }
    updateData[key] = value;
  }

  if (localePatch.ok) {
    updateData.country = localePatch.profile.countryName;
    updateData.countryCode = localePatch.profile.countryCode;
    updateData.defaultLocale = localePatch.profile.defaultLocale;
    updateData.supportedLocales = localePatch.profile.supportedLocales;
    updateData.timezone = localePatch.profile.timezone;
    updateData.currencyCode = localePatch.profile.currencyCode;
    updateData.dateFormat = localePatch.profile.dateFormat;
    updateData.numberFormat = localePatch.profile.numberFormat;
    updateData.textDirection = localePatch.profile.textDirection;
    updateData.defaultLanguage = mapLocaleToLegacyLanguage(
      localePatch.profile.defaultLocale,
    );
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data: updateData,
  });

  await writeAuditLog({
    tenantId: id,
    userId: auth.session!.userId,
    actionType: "UPDATE",
    entityType: "TenantSettings",
    entityId: id,
    changeData: { fields: Object.keys(data) },
    createdBy: auth.session!.user.name,
  });

  const settings = await getTenantSettingsPayload(updated.id);
  return NextResponse.json(settings);
}
