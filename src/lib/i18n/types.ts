import type { TextDirection } from "@/lib/locale/types";

export type MessageDictionary = Record<string, string>;

export type MessageBundle = Partial<Record<string, MessageDictionary>>;

export type LocaleResolutionSource = "user" | "cookie" | "tenant" | "fallback";

export type ResolvedLocale = {
  locale: string;
  direction: TextDirection;
  source: LocaleResolutionSource;
};

export type TenantLocaleSettings = {
  tenantId: string;
  defaultLocale: string;
  supportedLocales: string[];
  timezone: string;
  currencyCode: string;
  dateFormat: string;
  numberFormat: string;
  textDirection: TextDirection;
};

export type I18nContext = {
  locale: string;
  direction: TextDirection;
  source: LocaleResolutionSource;
  supportedLocales: string[];
  tenantSettings: TenantLocaleSettings | null;
  messages: MessageBundle;
  t: (key: string, fallback?: string) => string;
};

export type ClientI18nPack = {
  locale: string;
  direction: TextDirection;
  supportedLocales: string[];
  messages: MessageBundle;
};
