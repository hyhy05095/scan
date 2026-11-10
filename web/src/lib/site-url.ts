export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configuredUrl) {
    return "http://localhost:3000";
  }

  const url = new URL(configuredUrl);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }

  return url.origin;
}

export function getSafeNextPath(value: string | null, fallback = "/dashboard") {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  const internalOrigin = new URL("https://supanext.invalid");

  try {
    const destination = new URL(value, internalOrigin);

    if (destination.origin !== internalOrigin.origin) {
      return fallback;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
