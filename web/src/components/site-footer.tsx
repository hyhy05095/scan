import Link from "next/link";

import { type Locale, localizePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function SiteFooter({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>{dictionary.footer.description}</p>
          <nav className="flex flex-wrap gap-4" aria-label="Legal navigation">
            <Link
              className="hover:text-foreground"
              href={localizePath(locale, "/legal/privacy-policy")}
            >
              {dictionary.footer.privacy}
            </Link>
            <Link
              className="hover:text-foreground"
              href={localizePath(locale, "/legal/terms-of-service")}
            >
              {dictionary.footer.terms}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
