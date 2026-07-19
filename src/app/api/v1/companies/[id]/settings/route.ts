import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  const data: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    data[key] =
      value === null || value === undefined ? null : String(value).trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data: {
      ...data,
      updatedBy: auth.session!.user.name,
    },
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
