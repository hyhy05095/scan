import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dictionary = await getDictionary(lang);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <section className="bg-card space-y-3 rounded-xl border p-6">
        <p className="text-muted-foreground text-sm font-medium">
          {dictionary.dashboard.eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {dictionary.dashboard.welcome}.
        </h1>
        <p className="text-muted-foreground text-lg leading-8">
          {dictionary.dashboard.description}
        </p>
      </section>
      <div
        className="grid auto-rows-min gap-4 md:grid-cols-3"
        aria-hidden="true"
      >
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div
        className="bg-muted/50 min-h-80 flex-1 rounded-xl"
        aria-hidden="true"
      />
    </main>
  );
}
