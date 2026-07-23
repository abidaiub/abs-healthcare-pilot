import type { CountryRegionalSuggestion } from "@/lib/locale/types";

export const COUNTRY_REGIONAL_DEFAULTS: CountryRegionalSuggestion[] = [
  {
    countryCode: "BD",
    countryName: "Bangladesh",
    defaultLocale: "bn-BD",
    supportedLocales: ["bn-BD", "en-BD"],
    timezone: "Asia/Dhaka",
    currencyCode: "BDT",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "en-IN",
    textDirection: "ltr",
  },
  {
    countryCode: "SA",
    countryName: "Saudi Arabia",
    defaultLocale: "ar-SA",
    supportedLocales: ["ar-SA", "en-US"],
    timezone: "Asia/Riyadh",
    currencyCode: "SAR",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "ar-SA",
    textDirection: "rtl",
  },
  {
    countryCode: "AE",
    countryName: "United Arab Emirates",
    defaultLocale: "ar-AE",
    supportedLocales: ["ar-AE", "en-US"],
    timezone: "Asia/Dubai",
    currencyCode: "AED",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "ar-AE",
    textDirection: "rtl",
  },
  {
    countryCode: "PK",
    countryName: "Pakistan",
    defaultLocale: "ur-PK",
    supportedLocales: ["ur-PK", "en-PK"],
    timezone: "Asia/Karachi",
    currencyCode: "PKR",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "en-IN",
    textDirection: "rtl",
  },
  {
    countryCode: "IN",
    countryName: "India",
    defaultLocale: "en-IN",
    supportedLocales: ["en-IN", "hi-IN", "bn-IN"],
    timezone: "Asia/Kolkata",
    currencyCode: "INR",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "en-IN",
    textDirection: "ltr",
  },
  {
    countryCode: "US",
    countryName: "United States",
    defaultLocale: "en-US",
    supportedLocales: ["en-US"],
    timezone: "America/New_York",
    currencyCode: "USD",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "en-US",
    textDirection: "ltr",
  },
  {
    countryCode: "INT",
    countryName: "International",
    defaultLocale: "en-US",
    supportedLocales: ["en-US", "en-BD", "bn-BD", "ar-SA", "ur-PK", "hi-IN"],
    timezone: "UTC",
    currencyCode: "USD",
    dateFormat: "YYYY-MM-DD",
    numberFormat: "en-US",
    textDirection: "ltr",
  },
];

const COUNTRY_MAP = new Map(
  COUNTRY_REGIONAL_DEFAULTS.map((entry) => [entry.countryCode, entry]),
);

export function getCountrySuggestion(countryCode: string): CountryRegionalSuggestion | null {
  return COUNTRY_MAP.get(countryCode.trim().toUpperCase()) ?? null;
}

export function listCountryOptions(): CountryRegionalSuggestion[] {
  return COUNTRY_REGIONAL_DEFAULTS;
}

export function inferCountryCodeFromLegacyCountry(country: string | null | undefined): string {
  const normalized = (country ?? "").trim().toLowerCase();
  if (!normalized || normalized === "bangladesh") return "BD";
  if (normalized.includes("saudi")) return "SA";
  if (normalized.includes("emirates") || normalized.includes("uae")) return "AE";
  if (normalized.includes("pakistan")) return "PK";
  if (normalized.includes("india")) return "IN";
  if (normalized.includes("united states") || normalized === "usa") return "US";
  return "INT";
}
