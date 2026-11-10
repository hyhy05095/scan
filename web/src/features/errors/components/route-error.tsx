"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { defaultLocale, hasLocale, localizePath } from "@/i18n/config";

const labels = {
  en: {
    description: "An unexpected error occurred.",
    home: "Go home",
    retry: "Try again",
    title: "Something went wrong",
  },
  es: {
    description: "Ocurrió un error inesperado.",
    home: "Ir al inicio",
    retry: "Intentar de nuevo",
    title: "Algo salió mal",
  },
  ko: {
    description: "예기치 않은 오류가 발생했습니다.",
    home: "홈으로 이동",
    retry: "다시 시도",
    title: "문제가 발생했습니다",
  },
  zh: {
    description: "发生了意外错误。",
    home: "返回首页",
    retry: "重试",
    title: "出错了",
  },
  ja: {
    description: "予期しないエラーが発生しました。",
    home: "ホームへ",
    retry: "もう一度",
    title: "問題が発生しました",
  },
  ru: {
    description: "Произошла непредвиденная ошибка.",
    home: "На главную",
    retry: "Повторить",
    title: "Что-то пошло не так",
  },
} as const;

export function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? defaultLocale;
  const locale = hasLocale(language) ? language : defaultLocale;
  const copy = labels[locale];

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-destructive text-sm font-semibold tracking-[0.2em] uppercase">
        500
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="text-muted-foreground">{copy.description}</p>
      {error.digest ? (
        <p className="text-muted-foreground font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Button onClick={retry} type="button">
          {copy.retry}
        </Button>
        <Button asChild variant="outline">
          <Link href={localizePath(locale)}>{copy.home}</Link>
        </Button>
      </div>
    </main>
  );
}
