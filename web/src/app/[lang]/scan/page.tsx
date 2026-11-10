import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ScanApp } from "@/features/scan/components/scan-app";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { scan } = await getDictionary(lang);
  return { title: scan.title, description: scan.subtitle };
}

// Public page: no auth check.
export default async function ScanPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { scan } = await getDictionary(lang);

  return <ScanApp labels={scan} locale={lang} />;
}
