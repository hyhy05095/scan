import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SentryTest } from "@/features/debug/components/sentry-test";
import { isSentryDebugEnabled } from "@/features/debug/config";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Sentry test",
};

export default async function SentryDebugPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { debug } = await getDictionary(lang);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        {debug.sentryTitle}
      </h1>
      <p className="text-muted-foreground mt-2">{debug.sentryDescription}</p>
      <SentryTest
        enabled={isSentryDebugEnabled()}
        labels={{
          captured: debug.sentryCaptured,
          configurationRequired: debug.sentryConfigurationRequired,
          trigger: debug.sentryTrigger,
          triggering: debug.sentryTriggering,
        }}
      />
    </main>
  );
}
