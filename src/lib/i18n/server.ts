import { cookies } from "next/headers";
import { LOCALE_COOKIE, MOD06_PRIMARY_LOCALES } from "@/lib/i18n/constants";
import { loadLocalizedMessages } from "@/lib/i18n/messages";
import { resolveLocale } from "@/lib/i18n/resolve";
import { getTenantLocaleSettings } from "@/lib/i18n/tenant-context";
import { createTranslator } from "@/lib/i18n/translate";
import type { ClientI18nPack, I18nContext } from "@/lib/i18n/types";
import { prisma } from "@/lib/db";
import { isHostSession, isTenantSession, type SessionContext } from "@/lib/session";

export async function getServerI18n(session?: SessionContext | null): Promise<I18nContext> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value ?? null;

  let tenantSettings = null;
  let userPreferredLocale: string | null = null;
  const isHost = session ? isHostSession(session) : false;

  if (session && isTenantSession(session)) {
    tenantSettings = await getTenantLocaleSettings(session.tenantId);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { preferredLocale: true, isActive: true, userStatus: true },
    });

    if (user?.isActive && user.userStatus === "ACTIVE") {
      userPreferredLocale = user.preferredLocale;
    }
  }

  const resolved = resolveLocale({
    userPreferredLocale,
    cookieLocale,
    tenantSettings,
    isHost,
  });

  const messages = loadLocalizedMessages(resolved.locale);
  const supportedLocales = isHost
    ? [...MOD06_PRIMARY_LOCALES]
    : (tenantSettings?.supportedLocales ?? [...MOD06_PRIMARY_LOCALES]);

  return {
    locale: resolved.locale,
    direction: resolved.direction,
    source: resolved.source,
    supportedLocales,
    tenantSettings,
    messages,
    t: createTranslator(messages),
  };
}

export function toClientI18nPack(context: I18nContext): ClientI18nPack {
  return {
    locale: context.locale,
    direction: context.direction,
    supportedLocales: context.supportedLocales,
    messages: context.messages,
  };
}
