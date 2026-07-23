export const LOCALE_COOKIE = "abs-pilot-locale";

/** Application-wide fallback when tenant configuration is malformed. */
export const APP_FALLBACK_LOCALE = "en-BD";

/** Primary MOD-06 locales with complete dictionary coverage targets. */
export const MOD06_PRIMARY_LOCALES = [
  "en-BD",
  "bn-BD",
  "ar-SA",
  "ur-PK",
  "hi-IN",
] as const;

export type Mod06PrimaryLocale = (typeof MOD06_PRIMARY_LOCALES)[number];

export const REQUIRED_MESSAGE_NAMESPACES = [
  "common",
  "navigation",
  "auth",
  "tenant",
  "users",
  "rbac",
  "audit",
  "validation",
  "system",
  "profile",
  "screens",
  "branch",
  "patient",
  "appointment",
] as const;

export type MessageNamespace = (typeof REQUIRED_MESSAGE_NAMESPACES)[number];

export const LANGUAGE_FAMILY_FALLBACK: Record<string, string> = {
  bn: "bn-BD",
  en: "en-BD",
  ar: "ar-SA",
  ur: "ur-PK",
  hi: "hi-IN",
};
