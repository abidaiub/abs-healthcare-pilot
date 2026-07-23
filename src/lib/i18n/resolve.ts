import {
  APP_FALLBACK_LOCALE,
  LANGUAGE_FAMILY_FALLBACK,
  MOD06_PRIMARY_LOCALES,
} from "@/lib/i18n/constants";
import type {
  LocaleResolutionSource,
  ResolvedLocale,
  TenantLocaleSettings,
} from "@/lib/i18n/types";
import {
  isApplicationSupportedLocale,
  normalizeLocaleList,
  resolveTextDirectionForLocale,
} from "@/lib/locale/registry";

export type LocaleResolutionInput = {
  userPreferredLocale?: string | null;
  cookieLocale?: string | null;
  tenantSettings?: TenantLocaleSettings | null;
  isHost?: boolean;
};

function pickSupportedLocales(input: LocaleResolutionInput): string[] {
  if (input.isHost) {
    return [...MOD06_PRIMARY_LOCALES];
  }

  const tenantSupported = normalizeLocaleList(
    input.tenantSettings?.supportedLocales ?? [],
  );

  if (tenantSupported.length > 0) {
    return tenantSupported;
  }

  return [...MOD06_PRIMARY_LOCALES];
}

function pickFallbackLocale(
  supportedLocales: string[],
  tenantDefaultLocale?: string | null,
): string {
  if (tenantDefaultLocale && supportedLocales.includes(tenantDefaultLocale)) {
    return tenantDefaultLocale;
  }

  if (supportedLocales.includes(APP_FALLBACK_LOCALE)) {
    return APP_FALLBACK_LOCALE;
  }

  return supportedLocales[0] ?? APP_FALLBACK_LOCALE;
}

function isAllowedLocale(locale: string | null | undefined, supported: string[]): boolean {
  if (!locale) return false;
  return (
    isApplicationSupportedLocale(locale) &&
    supported.includes(locale) &&
    MOD06_PRIMARY_LOCALES.includes(locale as (typeof MOD06_PRIMARY_LOCALES)[number])
  );
}

function resolveWithFamilyFallback(
  locale: string,
  supported: string[],
): string | null {
  if (isAllowedLocale(locale, supported)) return locale;

  const language = locale.split("-")[0]?.toLowerCase();
  const family = language ? LANGUAGE_FAMILY_FALLBACK[language] : undefined;
  if (family && isAllowedLocale(family, supported)) {
    return family;
  }

  return null;
}

export function resolveLocale(input: LocaleResolutionInput): ResolvedLocale {
  const supportedLocales = pickSupportedLocales(input);
  const fallbackLocale = pickFallbackLocale(
    supportedLocales,
    input.tenantSettings?.defaultLocale,
  );

  const candidates: Array<{
    value?: string | null;
    source: LocaleResolutionSource;
  }> = [
    { value: input.userPreferredLocale, source: "user" },
    { value: input.cookieLocale, source: "cookie" },
    { value: input.tenantSettings?.defaultLocale, source: "tenant" },
  ];

  for (const candidate of candidates) {
    const resolved = resolveWithFamilyFallback(candidate.value ?? "", supportedLocales);
    if (resolved) {
      return {
        locale: resolved,
        direction: resolveTextDirectionForLocale(resolved),
        source: candidate.source,
      };
    }
  }

  return {
    locale: fallbackLocale,
    direction: resolveTextDirectionForLocale(fallbackLocale),
    source: "fallback",
  };
}

export function assertLocaleAllowedForTenant(
  locale: string,
  tenantSettings: TenantLocaleSettings | null,
  isHost = false,
): boolean {
  const supported = pickSupportedLocales({ tenantSettings, isHost });
  return isAllowedLocale(locale, supported);
}
