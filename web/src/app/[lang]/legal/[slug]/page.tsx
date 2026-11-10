import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

import { MdxContent } from "@/components/mdx-content";
import { getLegalDocument, hasLegalSlug, legalSlugs } from "@/content/legal";
import { hasLocale, locales, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return locales.flatMap((lang) => legalSlugs.map((slug) => ({ lang, slug })));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !hasLegalSlug(slug)) return {};
  const { frontmatter } = await getLegalDocument(lang, slug);
  return {
    title: String(frontmatter.title),
    description: String(frontmatter.description),
  };
}
export default async function LegalPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !hasLegalSlug(slug)) notFound();
  const [{ legal }, document] = await Promise.all([
    getDictionary(lang),
    getLegalDocument(lang, slug),
  ]);
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
      <Button asChild variant="outline">
        <Link href={localizePath(lang)}>&larr; {legal.back}</Link>
      </Button>
      <p className="mt-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        {legal.templateWarning}
      </p>
      <article className="mt-10">
        <MdxContent code={document.code} />
      </article>
    </main>
  );
}
