import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { payments } = await getDictionary(lang);
  return {
    title: payments.failureTitle,
    description: payments.failureDescription,
  };
}

export default async function PaymentFailurePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    code?: string | string[];
    message?: string | string[];
  }>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!hasLocale(lang)) notFound();
  const { payments: labels } = await getDictionary(lang);
  const code = safeDisplayValue(query.code, "PAYMENT_FAILED", 100);
  const message = safeDisplayValue(
    query.message,
    labels.failureDescription,
    500,
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-16 sm:px-6">
      <section className="bg-card w-full space-y-6 rounded-2xl border p-6 text-center shadow-sm sm:p-10">
        <p className="text-destructive text-sm font-semibold tracking-wider uppercase">
          {code}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          {labels.failureTitle}
        </h1>
        <p className="text-muted-foreground text-lg leading-8">{message}</p>
        <Button asChild>
          <Link href={localizePath(lang, "/payments/checkout")}>
            {labels.tryAgain}
          </Link>
        </Button>
      </section>
    </main>
  );
}

function safeDisplayValue(
  value: string | string[] | undefined,
  fallback: string,
  maxLength: number,
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.slice(0, maxLength) || fallback;
}
