"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createTranslator } from "@/lib/i18n/translate";
import type { ClientI18nPack } from "@/lib/i18n/types";

type I18nContextValue = ClientI18nPack & {
  t: (key: string, fallback?: string) => string;
  setPack: (pack: ClientI18nPack) => void;
};

const I18nReactContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initial,
  children,
}: {
  initial: ClientI18nPack;
  children: ReactNode;
}) {
  const [pack, setPack] = useState(initial);
  const t = useMemo(() => createTranslator(pack.messages), [pack.messages]);

  const value = useMemo(
    () => ({
      ...pack,
      t,
      setPack,
    }),
    [pack, t],
  );

  return <I18nReactContext.Provider value={value}>{children}</I18nReactContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nReactContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function LocaleDocument({
  locale,
  direction,
}: {
  locale: string;
  direction: "ltr" | "rtl";
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

  return null;
}
