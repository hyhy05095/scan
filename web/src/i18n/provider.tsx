"use client";

import { createInstance } from "i18next";
import { useMemo } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries";

export function TranslationProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Dictionary;
  children: React.ReactNode;
}) {
  const instance = useMemo(() => {
    const i18n = createInstance();
    void i18n.use(initReactI18next).init({
      lng: locale,
      fallbackLng: "en",
      resources: { [locale]: { translation: messages } },
      initAsync: false,
      interpolation: { escapeValue: false },
    });
    return i18n;
  }, [locale, messages]);
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
