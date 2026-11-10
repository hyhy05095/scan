import { createInstance } from "i18next";
import { cache } from "react";
import "server-only";

import type { Locale } from "./config";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  es: () => import("./dictionaries/es.json").then((module) => module.default),
  ko: () => import("./dictionaries/ko.json").then((module) => module.default),
  zh: () => import("./dictionaries/zh.json").then((module) => module.default),
  ja: () => import("./dictionaries/ja.json").then((module) => module.default),
  ru: () => import("./dictionaries/ru.json").then((module) => module.default),
};

export const getDictionary = cache(async (locale: Locale) => {
  const messages = await dictionaries[locale]();
  const instance = createInstance();
  await instance.init({
    lng: locale,
    fallbackLng: "en",
    resources: { [locale]: { translation: messages } },
    interpolation: { escapeValue: false },
  });
  return instance.getResourceBundle(locale, "translation") as typeof messages;
});

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
