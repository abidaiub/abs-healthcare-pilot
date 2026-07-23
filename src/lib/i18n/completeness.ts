import {
  flattenMessageKeys,
  getRequiredLocales,
  loadLocalizedMessages,
} from "@/lib/i18n/messages";
import { APP_FALLBACK_LOCALE, REQUIRED_MESSAGE_NAMESPACES } from "@/lib/i18n/constants";

export type CompletenessReport = {
  locale: string;
  missingKeys: string[];
  extraKeys: string[];
  ok: boolean;
};

export function compareLocaleMessageStructure(): {
  referenceLocale: string;
  reports: CompletenessReport[];
  ok: boolean;
} {
  const referenceLocale = APP_FALLBACK_LOCALE;
  const referenceBundle = loadLocalizedMessages(referenceLocale);
  const referenceKeys = new Set(flattenMessageKeys(referenceBundle));
  const reports: CompletenessReport[] = [];

  for (const locale of getRequiredLocales()) {
    const bundle = loadLocalizedMessages(locale);
    const localeKeys = new Set(flattenMessageKeys(bundle));
    const missingKeys = [...referenceKeys].filter((key) => !localeKeys.has(key));
    const extraKeys = [...localeKeys].filter((key) => !referenceKeys.has(key));

    reports.push({
      locale,
      missingKeys,
      extraKeys,
      ok: missingKeys.length === 0,
    });
  }

  for (const namespace of REQUIRED_MESSAGE_NAMESPACES) {
    if (!referenceBundle[namespace] || Object.keys(referenceBundle[namespace]!).length === 0) {
      reports.push({
        locale: referenceLocale,
        missingKeys: [`namespace:${namespace}`],
        extraKeys: [],
        ok: false,
      });
    }
  }

  return {
    referenceLocale,
    reports,
    ok: reports.every((report) => report.ok),
  };
}
