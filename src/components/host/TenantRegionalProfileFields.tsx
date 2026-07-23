"use client";

import { useMemo, useState } from "react";
import {
  getCountrySuggestion,
  getLocaleDefinition,
  listCountryOptions,
  listSupportedLocaleCodes,
  resolveTextDirectionForLocale,
  SUPPORTED_LOCALE_REGISTRY,
} from "@/lib/locale";
import type { TenantLocaleProfile } from "@/lib/locale/types";
import { Button, Input, Select } from "@/components/ui";

const TIMEZONE_OPTIONS = [
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Riyadh",
  "Asia/Dubai",
  "America/New_York",
  "UTC",
];

const DATE_FORMAT_OPTIONS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const NUMBER_FORMAT_OPTIONS = ["en-IN", "en-US", "ar-SA", "ar-AE"];

function buildInitialProfile(initial?: Partial<TenantLocaleProfile>): TenantLocaleProfile {
  const suggestion = getCountrySuggestion(initial?.countryCode ?? "BD")!;
  return {
    countryCode: initial?.countryCode ?? suggestion.countryCode,
    countryName: initial?.countryName ?? suggestion.countryName,
    defaultLocale: initial?.defaultLocale ?? suggestion.defaultLocale,
    supportedLocales:
      initial?.supportedLocales?.length
        ? initial.supportedLocales
        : suggestion.supportedLocales,
    timezone: initial?.timezone ?? suggestion.timezone,
    currencyCode: initial?.currencyCode ?? suggestion.currencyCode,
    dateFormat: initial?.dateFormat ?? suggestion.dateFormat,
    numberFormat: initial?.numberFormat ?? suggestion.numberFormat,
    textDirection:
      initial?.textDirection ??
      resolveTextDirectionForLocale(initial?.defaultLocale ?? suggestion.defaultLocale),
  };
}

export function TenantRegionalProfileFields({
  initial,
}: {
  initial?: Partial<TenantLocaleProfile>;
}) {
  const [profile, setProfile] = useState<TenantLocaleProfile>(() =>
    buildInitialProfile(initial),
  );
  const [localeTouched, setLocaleTouched] = useState(false);
  const [pendingCountryCode, setPendingCountryCode] = useState<string | null>(null);

  const countryOptions = useMemo(() => listCountryOptions(), []);
  const localeOptions = useMemo(() => listSupportedLocaleCodes(), []);

  const previewDirection = resolveTextDirectionForLocale(profile.defaultLocale);

  function markTouched() {
    setLocaleTouched(true);
  }

  function updateProfile(next: Partial<TenantLocaleProfile>) {
    markTouched();
    setProfile((current) => {
      const merged = { ...current, ...next };
      if (next.defaultLocale) {
        merged.textDirection = resolveTextDirectionForLocale(next.defaultLocale);
      }
      if (next.supportedLocales && !next.supportedLocales.includes(merged.defaultLocale)) {
        merged.defaultLocale = next.supportedLocales[0] ?? merged.defaultLocale;
        merged.textDirection = resolveTextDirectionForLocale(merged.defaultLocale);
      }
      return merged;
    });
  }

  function handleCountryChange(countryCode: string) {
    const suggestion = getCountrySuggestion(countryCode);
    if (!suggestion) return;

    if (localeTouched) {
      setPendingCountryCode(countryCode);
      return;
    }

    setProfile({
      countryCode: suggestion.countryCode,
      countryName: suggestion.countryName,
      defaultLocale: suggestion.defaultLocale,
      supportedLocales: suggestion.supportedLocales,
      timezone: suggestion.timezone,
      currencyCode: suggestion.currencyCode,
      dateFormat: suggestion.dateFormat,
      numberFormat: suggestion.numberFormat,
      textDirection: suggestion.textDirection,
    });
  }

  function applyPendingSuggestion() {
    if (!pendingCountryCode) return;
    const suggestion = getCountrySuggestion(pendingCountryCode);
    if (!suggestion) return;

    setProfile({
      countryCode: suggestion.countryCode,
      countryName: suggestion.countryName,
      defaultLocale: suggestion.defaultLocale,
      supportedLocales: suggestion.supportedLocales,
      timezone: suggestion.timezone,
      currencyCode: suggestion.currencyCode,
      dateFormat: suggestion.dateFormat,
      numberFormat: suggestion.numberFormat,
      textDirection: suggestion.textDirection,
    });
    setPendingCountryCode(null);
    setLocaleTouched(false);
  }

  function toggleSupportedLocale(locale: string, checked: boolean) {
    markTouched();
    setProfile((current) => {
      const next = checked
        ? [...new Set([...current.supportedLocales, locale])]
        : current.supportedLocales.filter((entry) => entry !== locale);

      if (next.length === 0) {
        return current;
      }

      const defaultLocale = next.includes(current.defaultLocale)
        ? current.defaultLocale
        : next[0];

      return {
        ...current,
        supportedLocales: next,
        defaultLocale,
        textDirection: resolveTextDirectionForLocale(defaultLocale),
      };
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Regional profile
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Country selection suggests defaults only. Override any field before saving.
        </p>
      </div>

      {pendingCountryCode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>
            Apply suggested regional defaults for{" "}
            {getCountrySuggestion(pendingCountryCode)?.countryName ?? pendingCountryCode}?
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setPendingCountryCode(null)}>
              Keep current
            </Button>
            <Button type="button" onClick={applyPendingSuggestion}>
              Apply suggestions
            </Button>
          </div>
        </div>
      )}

      <input type="hidden" name="country" value={profile.countryName} />
      <input type="hidden" name="countryCode" value={profile.countryCode} />
      <input
        type="hidden"
        name="supportedLocales"
        value={JSON.stringify(profile.supportedLocales)}
      />
      <input type="hidden" name="textDirection" value={profile.textDirection} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="Country / region *"
          name="countryCodeDisplay"
          value={profile.countryCode}
          onChange={(event) => handleCountryChange(event.target.value)}
        >
          {countryOptions.map((country) => (
            <option key={country.countryCode} value={country.countryCode}>
              {country.countryName}
            </option>
          ))}
        </Select>

        <Select
          label="Primary language *"
          name="defaultLocale"
          value={profile.defaultLocale}
          onChange={(event) => updateProfile({ defaultLocale: event.target.value })}
        >
          {profile.supportedLocales.map((locale) => {
            const definition = getLocaleDefinition(locale);
            return (
              <option key={locale} value={locale}>
                {definition?.label ?? locale}
              </option>
            );
          })}
        </Select>

        <Select
          label="Time zone *"
          name="timezone"
          value={profile.timezone}
          onChange={(event) => updateProfile({ timezone: event.target.value })}
        >
          {TIMEZONE_OPTIONS.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </Select>

        <Input
          label="Currency code *"
          name="currencyCode"
          value={profile.currencyCode}
          onChange={(event) =>
            updateProfile({ currencyCode: event.target.value.toUpperCase() })
          }
          maxLength={3}
        />

        <Select
          label="Date format *"
          name="dateFormat"
          value={profile.dateFormat}
          onChange={(event) => updateProfile({ dateFormat: event.target.value })}
        >
          {DATE_FORMAT_OPTIONS.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </Select>

        <Select
          label="Number format *"
          name="numberFormat"
          value={profile.numberFormat}
          onChange={(event) => updateProfile({ numberFormat: event.target.value })}
        >
          {NUMBER_FORMAT_OPTIONS.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Additional languages</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_LOCALE_REGISTRY.map((entry) => (
            <label
              key={entry.locale}
              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={profile.supportedLocales.includes(entry.locale)}
                onChange={(event) =>
                  toggleSupportedLocale(entry.locale, event.target.checked)
                }
              />
              <span>
                {entry.label}
                <span className="ml-1 text-xs text-slate-500">({entry.locale})</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          At least one language must remain enabled. Primary language must be selected above.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          Text direction preview:{" "}
          <span className="font-medium uppercase">{previewDirection}</span>
          {previewDirection === "rtl" ? " — right-to-left layout for Arabic/Urdu." : "."}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Full RTL rendering and translation switching remain in MOD-06.
        </p>
      </div>

      <p className="text-xs text-slate-500">
        Application registry currently prepares: Bangla, English, Arabic, Urdu, and Hindi.
        Full UI translation requires MOD-06 dictionaries and QC.
      </p>

      <datalist id="locale-options">
        {localeOptions.map((locale) => (
          <option key={locale} value={locale} />
        ))}
      </datalist>
    </section>
  );
}
