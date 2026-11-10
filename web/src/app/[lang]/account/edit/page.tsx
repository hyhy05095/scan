import { permanentRedirect } from "next/navigation";

import { hasLocale, localizePath } from "@/i18n/config";

export default async function LegacyAccountEditPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  permanentRedirect(
    hasLocale(lang) ? localizePath(lang, "/account") : "/en/account",
  );
}
