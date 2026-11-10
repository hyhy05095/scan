import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";

import { paymentRedirectSchema } from "@/features/payments/schemas";
import {
  PaymentConfirmationError,
  confirmPayment,
} from "@/features/payments/toss";
import { type Locale, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { payments } = await getDictionary(lang);
  return {
    title: payments.successTitle,
    description: payments.successDescription,
  };
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!hasLocale(lang)) notFound();
  const parsed = paymentRedirectSchema.safeParse(singleValueRecord(query));
  if (!parsed.success)
    redirect(
      failureUrl(
        lang,
        "INVALID_REDIRECT",
        "The payment return parameters are invalid.",
      ),
    );

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const returnPath = `${localizePath(lang, "/payments/success")}?${new URLSearchParams(parsed.data as unknown as Record<string, string>).toString()}`;
    redirect(
      `${localizePath(lang, "/login")}?next=${encodeURIComponent(returnPath)}`,
    );
  }

  let payment;
  try {
    payment = await confirmPayment({
      amountFromRedirect: parsed.data.amount,
      orderId: parsed.data.orderId,
      paymentKey: parsed.data.paymentKey,
      userId: data.user.id,
    });
  } catch (caught) {
    if (caught instanceof PaymentConfirmationError) {
      redirect(
        failureUrl(lang, caught.code, caught.message, parsed.data.orderId),
      );
    }
    throw caught;
  }

  const { payments: labels } = await getDictionary(lang);
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-20">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl border">
          <Image
            alt="Supabase Beagle NFT"
            className="object-cover"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            src="/nft-2.jpg"
          />
        </div>
        <section className="space-y-6">
          <p className="text-sm font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            {labels.verified}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {labels.successTitle}
          </h1>
          <p className="text-muted-foreground text-lg leading-8">
            {labels.successDescription}
          </p>
          <dl className="bg-card grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 rounded-xl border p-5 text-sm">
            <dt className="text-muted-foreground">{labels.orderId}</dt>
            <dd className="min-w-0 font-medium break-all">
              {payment.order_id}
            </dd>
            <dt className="text-muted-foreground">{labels.product}</dt>
            <dd className="font-medium">{payment.order_name}</dd>
            <dt className="text-muted-foreground">{labels.amount}</dt>
            <dd className="font-medium">
              {formatCurrency(payment.total_amount, payment.currency, lang)}
            </dd>
            <dt className="text-muted-foreground">{labels.status}</dt>
            <dd className="font-medium">{payment.status}</dd>
          </dl>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={localizePath(lang, "/dashboard/payments")}>
                {labels.viewPayments}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={payment.receipt_url} rel="noreferrer" target="_blank">
                {labels.viewReceipt}
              </a>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

function singleValueRecord(
  input: Record<string, string | string[] | undefined>,
) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}

function failureUrl(
  lang: Locale,
  code: string,
  message: string,
  orderId?: string,
) {
  const query = new URLSearchParams({
    code,
    message,
    ...(orderId ? { orderId } : {}),
  });
  return `${localizePath(lang, "/payments/failure")}?${query}`;
}

function formatCurrency(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
