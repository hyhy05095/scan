import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

import { MdxContent } from "@/components/mdx-content";
import { getPost, getPosts, loadPost } from "@/features/blog/posts";
import { hasLocale, locales, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getPosts();
  return locales.flatMap((lang) =>
    posts.map((post) => ({ lang, slug: post.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      description: post.description,
      title: post.title,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      description: post.description,
      title: post.title,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const post = await getPost(slug);
  if (!post) notFound();
  const [Content, dictionary] = await Promise.all([
    loadPost(post.slug),
    getDictionary(lang),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
      <Button asChild className="mb-8" variant="ghost">
        <Link href={localizePath(lang, "/blog")}>{dictionary.blog.back}</Link>
      </Button>
      <article>
        <header className="space-y-5">
          <span className="bg-secondary text-secondary-foreground inline-flex rounded-full px-2.5 py-1 text-xs font-medium">
            {post.category}
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            {post.title}
          </h1>
          <p className="text-muted-foreground">
            {dictionary.blog.by} {post.author} · {formatDate(post.date, lang)}
          </p>
        </header>
        <div className="bg-muted relative mt-10 aspect-square overflow-hidden rounded-xl border">
          <Image
            alt={post.title}
            className="object-cover"
            fill
            priority
            sizes="(min-width: 896px) 896px, 100vw"
            src={`/blog/${post.slug}.jpg`}
          />
        </div>
        <div className="mt-10">
          <MdxContent code={Content} />
        </div>
      </article>
    </main>
  );
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
