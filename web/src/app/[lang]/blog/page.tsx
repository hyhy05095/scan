import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPosts } from "@/features/blog/posts";
import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { blog } = await getDictionary(lang);
  return { title: blog.title, description: blog.description };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { blog } = await getDictionary(lang);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 sm:px-6 sm:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {blog.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">{blog.description}</p>
      </header>
      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {(await getPosts()).map((post) => (
          <article className="group min-w-0" key={post.slug}>
            <Link
              className="block space-y-4"
              href={localizePath(lang, `/blog/${post.slug}`)}
            >
              <div className="bg-muted relative aspect-square overflow-hidden rounded-xl border">
                <Image
                  alt={post.title}
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  src={`/blog/${post.slug}.jpg`}
                />
              </div>
              <div className="space-y-2">
                <span className="bg-secondary text-secondary-foreground inline-flex rounded-full px-2.5 py-1 text-xs font-medium">
                  {post.category}
                </span>
                <h2 className="text-xl font-semibold tracking-tight group-hover:underline group-hover:underline-offset-4">
                  {post.title}
                </h2>
                <p className="text-muted-foreground leading-7">
                  {post.description}
                </p>
                <p className="text-muted-foreground text-sm">
                  {blog.by} {post.author} · {formatDate(post.date, lang)}
                </p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
