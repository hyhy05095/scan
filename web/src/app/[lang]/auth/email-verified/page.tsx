import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

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
  const { account } = await getDictionary(lang);
  return {
    title: account.emailVerifiedTitle,
    description: account.emailVerifiedDescription,
  };
}

export default async function EmailVerifiedPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-6 py-16">
      <section className="bg-card w-full space-y-5 rounded-xl border p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {dictionary.account.emailVerifiedTitle}
        </h1>
        <p className="text-muted-foreground leading-7">
          {dictionary.account.emailVerifiedDescription}
        </p>
        <Button asChild>
          <Link href={localizePath(lang, "/account")}>
            {dictionary.account.backToAccount}
          </Link>
        </Button>
      </section>
    </main>
  );
}
