import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

import { legalSlugs } from "@/content/legal";
import { getPosts } from "@/features/blog/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "/",
    "/blog",
    "/contact",
    "/login",
    "/join",
    ...legalSlugs.map((slug) => "/legal/" + slug),
  ];
  const posts = await getPosts();
  return [
    ...paths.map((path) => ({ url: getSiteUrl() + path })),
    ...posts.map((post) => ({
      url: getSiteUrl() + "/blog/" + post.slug,
      lastModified: new Date(post.date),
    })),
  ];
}
