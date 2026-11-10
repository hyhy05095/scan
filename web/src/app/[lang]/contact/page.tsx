import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactForm } from "@/features/contact/components/contact-form";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { contact } = await getDictionary(lang);
  return { title: contact.title, description: contact.description };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { contact } = await getDictionary(lang);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6 sm:py-20">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {contact.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          {contact.description}
        </p>
      </header>
      <div className="bg-card rounded-2xl border p-5 shadow-sm sm:p-8">
        <ContactForm
          hcaptchaSiteKey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
          labels={contact}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      </div>
    </main>
  );
}
