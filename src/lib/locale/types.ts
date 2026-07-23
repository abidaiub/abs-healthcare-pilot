export type TextDirection = "ltr" | "rtl";

export type SupportedLocaleDefinition = {
  locale: string;
  label: string;
  nativeLabel: string;
  textDirection: TextDirection;
  languageCode: string;
};

export type TenantLocaleProfileInput = {
  countryCode: string;
  defaultLocale: string;
  supportedLocales: string[];
  timezone: string;
  currencyCode: string;
  dateFormat: string;
  numberFormat: string;
  textDirection: TextDirection;
  countryName?: string;
};

export type TenantLocaleProfile = TenantLocaleProfileInput & {
  countryName: string;
};

export type CountryRegionalSuggestion = {
  countryCode: string;
  countryName: string;
  defaultLocale: string;
  supportedLocales: string[];
  timezone: string;
  currencyCode: string;
  dateFormat: string;
  numberFormat: string;
  textDirection: TextDirection;
};
