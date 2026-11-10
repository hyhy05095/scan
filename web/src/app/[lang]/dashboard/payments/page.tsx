import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";

import { getPaymentHistory } from "@/features/payments/data";
import { hasLocale, localizePath } from "@/i18n/config";
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
    title: payments.historyTitle,
    description: payments.historyDescription,
  };
}

export default async function PaymentHistoryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) redirect(localizePath(lang, "/login"));
  const [{ payments: labels }, history] = await Promise.all([
    getDictionary(lang),
    getPaymentHistory(data.claims.sub),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {labels.historyTitle}
          </h1>
          <p className="text-muted-foreground">{labels.historyDescription}</p>
        </div>
        <Button asChild>
          <Link href={localizePath(lang, "/payments/checkout")}>
            {labels.makePayment}
          </Link>
        </Button>
      </div>

      {history.length === 0 ? (
        <section className="bg-card rounded-2xl border p-10 text-center">
          <p className="text-muted-foreground text-lg">{labels.empty}</p>
        </section>
      ) : (
        <div className="bg-card overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-3xl text-left text-sm">
            <caption className="sr-only">{labels.historyDescription}</caption>
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium" scope="col">
                  {labels.orderId}
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {labels.status}
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {labels.product}
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {labels.amount}
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {labels.date}
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {labels.receipt}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((payment) => (
                <tr key={payment.paymentId}>
                  <td className="max-w-48 truncate px-4 py-3 font-mono text-xs">
                    {payment.orderId}
                  </td>
                  <td className="px-4 py-3">{payment.status}</td>
                  <td className="px-4 py-3 font-medium">{payment.orderName}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(
                      payment.totalAmount,
                      payment.currency,
                      lang,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {new Intl.DateTimeFormat(lang, {
                      dateStyle: "medium",
                    }).format(new Date(payment.approvedAt))}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      className="font-medium underline-offset-4 hover:underline"
                      href={payment.receiptUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {labels.viewReceipt}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function formatCurrency(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
