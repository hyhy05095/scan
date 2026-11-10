import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalyticsTest } from "@/features/debug/components/analytics-test";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Google Analytics test",
};

export default async function AnalyticsDebugPage({
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
        {debug.analyticsTitle}
      </h1>
      <p className="text-muted-foreground mt-2">{debug.analyticsDescription}</p>
      <AnalyticsTest
        configured={Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID)}
        labels={{
          configurationRequired: debug.analyticsConfigurationRequired,
          success: debug.analyticsSuccess,
          trigger: debug.analyticsTrigger,
        }}
      />
    </main>
  );
}
