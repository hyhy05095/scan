import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { CheckoutWidget } from "@/features/payments/components/checkout-widget";
import { getCheckoutCustomer } from "@/features/payments/data";
import { demoProduct } from "@/features/payments/product";
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
    title: payments.checkoutTitle,
    description: payments.checkoutDescription,
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dictionary, customer] = await Promise.all([
    getDictionary(lang),
    getCheckoutCustomer(),
  ]);
  if (!customer)
    redirect(
      localizePath(lang, "/login") +
        `?next=${encodeURIComponent(localizePath(lang, "/payments/checkout"))}`,
    );
  const labels = dictionary.payments;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="space-y-6">
          <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl border">
            <Image
              alt={demoProduct.name}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              src={demoProduct.image}
            />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              {labels.demoLabel}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {demoProduct.name}
            </h1>
            <p className="text-muted-foreground mt-3 leading-7">
              {labels.checkoutDescription}
            </p>
          </div>
        </section>
        <section className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
          <CheckoutWidget
            amount={demoProduct.amount}
            clientKey={process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY}
            customer={customer}
            labels={labels}
            locale={lang}
          />
        </section>
      </div>
    </main>
  );
}
