import type { TenantLocaleSettings } from "@/lib/i18n/types";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWithPattern(date: Date, pattern: string, locale: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const formatted = pattern
    .replace(/YYYY/g, map.year ?? "")
    .replace(/MM/g, map.month ?? "")
    .replace(/DD/g, map.day ?? "")
    .replace(/HH/g, map.hour ?? "")
    .replace(/mm/g, map.minute ?? "")
    .replace(/ss/g, map.second ?? "");

  return formatted;
}

export function formatTenantDate(
  value: Date | string | null | undefined,
  settings: TenantLocaleSettings | null,
  locale: string,
): string {
  const date = toDate(value);
  if (!date) return "—";

  const timeZone = settings?.timezone ?? "UTC";
  const pattern = settings?.dateFormat ?? "DD/MM/YYYY";

  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-");
    return pattern
      .replace(/YYYY/g, year)
      .replace(/MM/g, month)
      .replace(/DD/g, day);
  }

  return formatWithPattern(date, pattern, locale, timeZone);
}

export function formatTenantDateTime(
  value: Date | string | null | undefined,
  settings: TenantLocaleSettings | null,
  locale: string,
): string {
  const date = toDate(value);
  if (!date) return "—";

  const timeZone = settings?.timezone ?? "UTC";
  const pattern = `${settings?.dateFormat ?? "DD/MM/YYYY"} HH:mm`;

  return formatWithPattern(date, pattern, locale, timeZone);
}

export function formatTenantNumber(
  value: number | null | undefined,
  settings: TenantLocaleSettings | null,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  const numberLocale = settings?.numberFormat ?? locale;
  try {
    return new Intl.NumberFormat(numberLocale, options).format(value);
  } catch {
    return new Intl.NumberFormat(locale, options).format(value);
  }
}

export function formatTenantCurrency(
  value: number | null | undefined,
  settings: TenantLocaleSettings | null,
  locale: string,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  const currency = settings?.currencyCode ?? "BDT";
  const numberLocale = settings?.numberFormat ?? locale;

  try {
    return new Intl.NumberFormat(numberLocale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${formatTenantNumber(value, settings, locale)}`;
  }
}
