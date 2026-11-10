import { notFound, redirect } from "next/navigation";

import { hasLocale, localizePath } from "@/i18n/config";

// 첫 화면은 스캔 화면으로 바로 이동
export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  redirect(localizePath(lang, "/scan"));
}
