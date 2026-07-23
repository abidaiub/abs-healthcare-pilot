import {
  getCountrySuggestion,
  inferCountryCodeFromLegacyCountry,
} from "@/lib/locale/country-defaults";
import {
  isApplicationSupportedLocale,
  isValidBcp47Locale,
  normalizeLocaleList,
  resolveTextDirectionForLocale,
} from "@/lib/locale/registry";
import type { TenantLocaleProfile, TenantLocaleProfileInput } from "@/lib/locale/types";

const ISO3166_ALPHA2 = /^[A-Z]{2,3}$/;
const ISO4217 = /^[A-Z]{3}$/;

export type LocaleValidationResult =
  | { ok: true; profile: TenantLocaleProfile }
  | { ok: false; error: string };

function parseSupportedLocales(raw: FormDataEntryValue | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) {
    return normalizeLocaleList(raw);
  }

  const value = String(raw ?? "").trim();
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeLocaleList(parsed.map(String));
    }
  } catch {
    // fall through to comma split for backward compatibility in tests only
  }

  return normalizeLocaleList(value.split(",").map((entry) => entry.trim()));
}

export function parseTenantLocaleProfileFromForm(formData: FormData): LocaleValidationResult {
  const countryCode = String(formData.get("countryCode") ?? "")
    .trim()
    .toUpperCase();
  const defaultLocale = String(formData.get("defaultLocale") ?? "").trim();
  const supportedLocales = parseSupportedLocales(formData.get("supportedLocales"));
  const timezone = String(formData.get("timezone") ?? "").trim();
  const currencyCode = String(formData.get("currencyCode") ?? "")
    .trim()
    .toUpperCase();
  const dateFormat = String(formData.get("dateFormat") ?? "").trim();
  const numberFormat = String(formData.get("numberFormat") ?? "").trim();
  const textDirectionRaw = String(formData.get("textDirection") ?? "ltr")
    .trim()
    .toLowerCase();
  const countryName =
    String(formData.get("country") ?? "").trim() ||
    getCountrySuggestion(countryCode)?.countryName ||
    countryCode;

  return validateTenantLocaleProfile({
    countryCode,
    defaultLocale,
    supportedLocales,
    timezone,
    currencyCode,
    dateFormat,
    numberFormat,
    textDirection: textDirectionRaw === "rtl" ? "rtl" : "ltr",
    countryName,
  });
}

export function validateTenantLocaleProfile(
  input: TenantLocaleProfileInput,
): LocaleValidationResult {
  const countryCode = input.countryCode.trim().toUpperCase();
  const defaultLocale = input.defaultLocale.trim();
  const supportedLocales = normalizeLocaleList(input.supportedLocales);
  const timezone = input.timezone.trim();
  const currencyCode = input.currencyCode.trim().toUpperCase();
  const dateFormat = input.dateFormat.trim();
  const numberFormat = input.numberFormat.trim();

  if (!ISO3166_ALPHA2.test(countryCode)) {
    return { ok: false, error: "Country code must be a valid ISO 3166-1 alpha-2/alpha-3 code." };
  }

  if (!defaultLocale || !isValidBcp47Locale(defaultLocale)) {
    return { ok: false, error: "Default locale must be a valid BCP 47 tag." };
  }

  if (!isApplicationSupportedLocale(defaultLocale)) {
    return { ok: false, error: "Default locale is not enabled in the application registry." };
  }

  if (supportedLocales.length === 0) {
    return { ok: false, error: "At least one supported locale must be enabled." };
  }

  for (const locale of supportedLocales) {
    if (!isValidBcp47Locale(locale) || !isApplicationSupportedLocale(locale)) {
      return { ok: false, error: `Unsupported locale in list: ${locale}` };
    }
  }

  if (!supportedLocales.includes(defaultLocale)) {
    return {
      ok: false,
      error: "Default locale must be included in supported locales.",
    };
  }

  if (!timezone) {
    return { ok: false, error: "Time zone is required." };
  }

  if (!ISO4217.test(currencyCode)) {
    return { ok: false, error: "Currency code must be a valid ISO 4217 code." };
  }

  if (!dateFormat) {
    return { ok: false, error: "Date format is required." };
  }

  if (!numberFormat) {
    return { ok: false, error: "Number format is required." };
  }

  const resolvedDirection = resolveTextDirectionForLocale(defaultLocale);
  const textDirection = input.textDirection === "rtl" ? "rtl" : "ltr";

  if (
    (defaultLocale.startsWith("ar-") || defaultLocale.startsWith("ur-")) &&
    textDirection !== "rtl"
  ) {
    return {
      ok: false,
      error: "Arabic and Urdu default locales require RTL text direction.",
    };
  }

  const countryName =
    input.countryName?.trim() ||
    getCountrySuggestion(countryCode)?.countryName ||
    countryCode;

  return {
    ok: true,
    profile: {
      countryCode,
      countryName,
      defaultLocale,
      supportedLocales,
      timezone,
      currencyCode,
      dateFormat,
      numberFormat,
      textDirection: resolvedDirection === "rtl" ? "rtl" : textDirection,
    },
  };
}

export function mapLocaleToLegacyLanguage(locale: string): string {
  return locale.trim().toLowerCase().startsWith("bn") ? "BN" : "EN";
}

export function inferLegacyTenantLocaleProfile(tenant: {
  country: string;
  timezone: string;
  defaultLanguage?: string | null;
  defaultLocale?: string | null;
  supportedLocales?: unknown;
  countryCode?: string | null;
  currencyCode?: string | null;
  dateFormat?: string | null;
  numberFormat?: string | null;
  textDirection?: string | null;
}): TenantLocaleProfile {
  if (tenant.defaultLocale && tenant.countryCode) {
    const supported = parseStoredSupportedLocales(tenant.supportedLocales);
    const candidate = validateTenantLocaleProfile({
      countryCode: tenant.countryCode,
      countryName: tenant.country,
      defaultLocale: tenant.defaultLocale,
      supportedLocales:
        supported.length > 0 ? supported : [tenant.defaultLocale],
      timezone: tenant.timezone,
      currencyCode: tenant.currencyCode ?? "BDT",
      dateFormat: tenant.dateFormat ?? "DD/MM/YYYY",
      numberFormat: tenant.numberFormat ?? "en-IN",
      textDirection: tenant.textDirection === "rtl" ? "rtl" : "ltr",
    });
    if (candidate.ok) return candidate.profile;
  }

  const countryCode = inferCountryCodeFromLegacyCountry(tenant.country);
  const suggestion = getCountrySuggestion(countryCode) ?? getCountrySuggestion("BD")!;

  const legacyLanguage = (tenant.defaultLanguage ?? "EN").trim().toUpperCase();
  let defaultLocale = suggestion.defaultLocale;
  if (legacyLanguage === "BN" && countryCode === "BD") defaultLocale = "bn-BD";
  if (legacyLanguage === "EN" && countryCode === "BD") defaultLocale = "en-BD";

  const supportedLocales = [...new Set([defaultLocale, ...suggestion.supportedLocales])];

  return {
    countryCode: suggestion.countryCode,
    countryName: suggestion.countryName,
    defaultLocale,
    supportedLocales: normalizeLocaleList(supportedLocales),
    timezone: tenant.timezone || suggestion.timezone,
    currencyCode: suggestion.currencyCode,
    dateFormat: suggestion.dateFormat,
    numberFormat: suggestion.numberFormat,
    textDirection: resolveTextDirectionForLocale(defaultLocale),
  };
}

export function serializeSupportedLocales(locales: string[]): string {
  return JSON.stringify(normalizeLocaleList(locales));
}

export function parseStoredSupportedLocales(value: unknown): string[] {
  if (Array.isArray(value)) {
    return normalizeLocaleList(value.map(String));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return normalizeLocaleList(parsed.map(String));
      }
    } catch {
      return [];
    }
  }
  return [];
}
