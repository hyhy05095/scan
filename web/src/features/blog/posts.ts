import { bundleMDX } from "mdx-bundler";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import "server-only";

const directory = path.join(process.cwd(), "src/content/blog");

export type BlogPost = {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  slug: string;
};

export async function getPosts(): Promise<BlogPost[]> {
  const files = (await readdir(directory)).filter((file) =>
    file.endsWith(".mdx"),
  );
  const posts = await Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(directory, file), "utf8");
      const { frontmatter } = await bundleMDX({ source, cwd: directory });
      const slug = file.slice(0, -4);
      for (const field of [
        "title",
        "description",
        "date",
        "author",
        "category",
      ]) {
        if (frontmatter[field] === undefined)
          throw new Error(file + ": missing " + field + " frontmatter");
      }
      return {
        title: String(frontmatter.title),
        description: String(frontmatter.description),
        date:
          frontmatter.date instanceof Date
            ? frontmatter.date.toISOString().slice(0, 10)
            : String(frontmatter.date),
        author: String(frontmatter.author),
        category: String(frontmatter.category),
        slug,
      };
    }),
  );
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string) {
  return (await getPosts()).find((post) => post.slug === slug) ?? null;
}

export async function loadPost(slug: string) {
  if (!(await getPost(slug))) throw new Error("Post not found");
  const source = await readFile(path.join(directory, slug + ".mdx"), "utf8");
  return (await bundleMDX({ source, cwd: directory })).code;
}
