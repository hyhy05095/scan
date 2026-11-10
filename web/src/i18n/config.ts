export const locales = ["en", "es", "ko", "zh", "ja", "ru"] as const;
export const defaultLocale = "en";

export type Locale = (typeof locales)[number];

export function hasLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleFromPathname(pathname: string) {
  const segment = pathname.split("/")[1];
  return segment && hasLocale(segment) ? segment : null;
}

export function localizePath(locale: Locale, path = "/") {
  // Locale is selected by cookie, as in Supaplate, not exposed in the URL.
  void locale;
  const routes: Record<string, string> = {
    "/auth/forgot-password": "/auth/forgot-password/reset",
    "/auth/new-password": "/auth/forgot-password/create",
    "/auth/otp": "/auth/otp/start",
    "/auth/otp/verify": "/auth/otp/complete",
    "/account": "/account/edit",
  };
  return routes[path] ?? path;
}

export function replacePathLocale(pathname: string, locale: Locale) {
  const currentLocale = getLocaleFromPathname(pathname);

  if (!currentLocale) {
    return localizePath(locale, pathname);
  }

  const pathWithoutLocale = pathname.slice(currentLocale.length + 1) || "/";
  return localizePath(locale, pathWithoutLocale);
}

export function matchPreferredLocale(acceptLanguage: string | null) {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const requestedLanguages = acceptLanguage
    .split(",")
    .map((entry) => entry.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const language of requestedLanguages) {
    const exact = locales.find((locale) => locale === language);
    const base = language?.split("-")[0];

    if (exact) {
      return exact;
    }

    if (base && hasLocale(base)) {
      return base;
    }
  }

  return defaultLocale;
}
