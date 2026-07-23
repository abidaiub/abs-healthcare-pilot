import type { MessageBundle } from "@/lib/i18n/types";

export function createTranslator(messages: MessageBundle) {
  return function t(key: string, fallback?: string): string {
    const dotIndex = key.indexOf(".");
    if (dotIndex <= 0) {
      return fallback ?? key;
    }

    const namespace = key.slice(0, dotIndex);
    const messageKey = key.slice(dotIndex + 1);
    const value = messages[namespace]?.[messageKey];

    if (value) return value;

    if (process.env.NODE_ENV === "development") {
      return `[missing:${key}]`;
    }

    return fallback ?? messageKey.replace(/\./g, " ");
  };
}

export function createErrorTranslator(messages: MessageBundle) {
  const t = createTranslator(messages);
  return function translateError(code: string, fallback?: string): string {
    return t(`validation.${code}`, fallback ?? t("system.genericError", "Something went wrong."));
  };
}
