"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/i18n/constants";
import { assertLocaleAllowedForTenant } from "@/lib/i18n/resolve";
import { getTenantLocaleSettings } from "@/lib/i18n/tenant-context";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isHostSession, isTenantSession } from "@/lib/session";
import { isApplicationSupportedLocale } from "@/lib/locale/registry";

export type LocaleActionResult =
  | { ok: true; locale: string }
  | { ok: false; errorCode: string };

export async function switchLocaleAction(locale: string): Promise<LocaleActionResult> {
  const session = await requireSession();
  const normalized = locale.trim();

  if (!isApplicationSupportedLocale(normalized)) {
    return { ok: false, errorCode: "INVALID_LOCALE" };
  }

  const isHost = isHostSession(session);
  const tenantSettings =
    isHost || !isTenantSession(session)
      ? null
      : await getTenantLocaleSettings(session.tenantId);

  if (!assertLocaleAllowedForTenant(normalized, tenantSettings, isHost)) {
    return { ok: false, errorCode: "LOCALE_NOT_ALLOWED" };
  }

  if (isTenantSession(session)) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, tenantId: true, isActive: true, userStatus: true },
    });

    if (!user || !user.isActive || user.userStatus !== "ACTIVE") {
      return { ok: false, errorCode: "USER_INACTIVE" };
    }

    if (user.tenantId !== session.tenantId) {
      return { ok: false, errorCode: "FORBIDDEN" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { preferredLocale: normalized },
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, normalized, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { ok: true, locale: normalized };
}
