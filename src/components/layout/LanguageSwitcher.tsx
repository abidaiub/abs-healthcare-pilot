"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchLocaleAction } from "@/app/actions/locale";
import { getLocaleDefinition } from "@/lib/locale/registry";
import { useI18n } from "@/lib/i18n/client";
import { Select } from "@/components/ui";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { locale, supportedLocales, t } = useI18n();
  const [pending, startTransition] = useTransition();

  function handleChange(nextLocale: string) {
    startTransition(async () => {
      const result = await switchLocaleAction(nextLocale);
      if (!result.ok) {
        window.alert(t(`validation.${result.errorCode}`, t("profile.switchFailed")));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {!compact && (
        <span className="text-xs text-slate-500">{t("common.labels.language")}</span>
      )}
      <Select
        value={locale}
        onChange={(event) => handleChange(event.target.value)}
        className="min-w-[140px] py-1.5 text-xs"
        aria-label={t("profile.switchLanguage")}
        disabled={pending}
      >
        {supportedLocales.map((entry) => {
          const definition = getLocaleDefinition(entry);
          return (
            <option key={entry} value={entry}>
              {definition?.nativeLabel ?? entry} ({entry})
            </option>
          );
        })}
      </Select>
    </div>
  );
}
