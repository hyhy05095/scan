"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { defaultLocale, hasLocale, localizePath } from "@/i18n/config";

const labels = {
  en: {
    description: "The page you are looking for does not exist.",
    home: "Go home",
    title: "Page not found",
  },
  es: {
    description: "La página que buscas no existe.",
    home: "Ir al inicio",
    title: "Página no encontrada",
  },
  ko: {
    description: "찾으시는 페이지가 존재하지 않습니다.",
    home: "홈으로 이동",
    title: "페이지를 찾을 수 없습니다",
  },
  zh: {
    description: "您要查找的页面不存在。",
    home: "返回首页",
    title: "页面未找到",
  },
  ja: {
    description: "お探しのページは存在しません。",
    home: "ホームへ",
    title: "ページが見つかりません",
  },
  ru: {
    description: "Страница, которую вы ищете, не существует.",
    home: "На главную",
    title: "Страница не найдена",
  },
} as const;

export function LocalizedNotFound() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? defaultLocale;
  const locale = hasLocale(language) ? language : defaultLocale;
  const copy = labels[locale];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-muted-foreground text-sm font-semibold tracking-[0.2em] uppercase">
        404
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h1>
      <p className="text-muted-foreground text-lg">{copy.description}</p>
      <Button asChild className="mt-3" variant="outline">
        <Link href={localizePath(locale)}>{copy.home} &rarr;</Link>
      </Button>
    </main>
  );
}
