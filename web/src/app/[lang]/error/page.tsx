import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Authentication error",
};

function boundedQueryValue(value: string | string[] | undefined) {
  const scalar = Array.isArray(value) ? value[0] : value;
  return scalar?.slice(0, 500) ?? null;
}

export default async function ErrorPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!hasLocale(lang)) notFound();
  const { errors } = await getDictionary(lang);
  const errorCode = boundedQueryValue(query.error_code ?? query.error);
  const errorDescription = boundedQueryValue(query.error_description);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <h1 className="text-destructive text-4xl font-semibold tracking-tight">
        {errors.authTitle}
      </h1>
      <p className="text-muted-foreground">
        {errorDescription ?? errors.authDescription}
      </p>
      {errorCode ? (
        <p className="text-muted-foreground font-mono text-xs">
          {errors.code}: {errorCode}
        </p>
      ) : null}
      <Button asChild className="mt-4" variant="outline">
        <Link href={localizePath(lang)}>{errors.home} &rarr;</Link>
      </Button>
    </main>
  );
}
