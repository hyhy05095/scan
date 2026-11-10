import { bundleMDX } from "mdx-bundler";
import { readFile } from "node:fs/promises";
import path from "node:path";
import "server-only";

import type { Locale } from "@/i18n/config";

export const legalSlugs = ["privacy-policy", "terms-of-service"] as const;
export type LegalSlug = (typeof legalSlugs)[number];

export function hasLegalSlug(value: string): value is LegalSlug {
  return legalSlugs.includes(value as LegalSlug);
}

export async function getLegalDocument(locale: Locale, slug: LegalSlug) {
  void locale;
  if (!hasLegalSlug(slug)) throw new Error("Legal document not found");
  const directory = path.join(process.cwd(), "src/content/legal");
  const source = await readFile(path.join(directory, slug + ".mdx"), "utf8");
  return bundleMDX({ source, cwd: directory });
}
