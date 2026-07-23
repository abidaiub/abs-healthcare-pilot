import type { SupportedLocaleDefinition, TextDirection } from "@/lib/locale/types";

export const SUPPORTED_LOCALE_REGISTRY: SupportedLocaleDefinition[] = [
  {
    locale: "bn-BD",
    label: "Bangla (Bangladesh)",
    nativeLabel: "বাংলা",
    textDirection: "ltr",
    languageCode: "bn",
  },
  {
    locale: "en-BD",
    label: "English (Bangladesh)",
    nativeLabel: "English",
    textDirection: "ltr",
    languageCode: "en",
  },
  {
    locale: "en-US",
    label: "English (United States)",
    nativeLabel: "English",
    textDirection: "ltr",
    languageCode: "en",
  },
  {
    locale: "en-IN",
    label: "English (India)",
    nativeLabel: "English",
    textDirection: "ltr",
    languageCode: "en",
  },
  {
    locale: "hi-IN",
    label: "Hindi (India)",
    nativeLabel: "हिन्दी",
    textDirection: "ltr",
    languageCode: "hi",
  },
  {
    locale: "bn-IN",
    label: "Bangla (India)",
    nativeLabel: "বাংলা",
    textDirection: "ltr",
    languageCode: "bn",
  },
  {
    locale: "ar-SA",
    label: "Arabic (Saudi Arabia)",
    nativeLabel: "العربية",
    textDirection: "rtl",
    languageCode: "ar",
  },
  {
    locale: "ar-AE",
    label: "Arabic (UAE)",
    nativeLabel: "العربية",
    textDirection: "rtl",
    languageCode: "ar",
  },
  {
    locale: "ur-PK",
    label: "Urdu (Pakistan)",
    nativeLabel: "اردو",
    textDirection: "rtl",
    languageCode: "ur",
  },
  {
    locale: "en-PK",
    label: "English (Pakistan)",
    nativeLabel: "English",
    textDirection: "ltr",
    languageCode: "en",
  },
];

const LOCALE_MAP = new Map(
  SUPPORTED_LOCALE_REGISTRY.map((entry) => [entry.locale, entry]),
);

const BCP47_PATTERN = /^[a-z]{2,3}(-[A-Z]{2})?$/;

export function isValidBcp47Locale(locale: string): boolean {
  return BCP47_PATTERN.test(locale.trim());
}

export function isApplicationSupportedLocale(locale: string): boolean {
  return LOCALE_MAP.has(locale.trim());
}

export function getLocaleDefinition(locale: string): SupportedLocaleDefinition | undefined {
  return LOCALE_MAP.get(locale.trim());
}

export function resolveTextDirectionForLocale(locale: string): TextDirection {
  return getLocaleDefinition(locale)?.textDirection ?? "ltr";
}

export function normalizeLocaleList(locales: string[]): string[] {
  const unique = [...new Set(locales.map((locale) => locale.trim()).filter(Boolean))];
  return unique.filter(isApplicationSupportedLocale);
}

export function listSupportedLocaleCodes(): string[] {
  return SUPPORTED_LOCALE_REGISTRY.map((entry) => entry.locale);
}
