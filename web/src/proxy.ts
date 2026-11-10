import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

import {
  getLocaleFromPathname,
  hasLocale,
  matchPreferredLocale,
} from "@/i18n/config";

const routeAliases: Record<string, string> = {
  "/auth/forgot-password/reset": "/auth/forgot-password",
  "/auth/forgot-password/create": "/auth/new-password",
  "/auth/otp/start": "/auth/otp",
  "/auth/otp/complete": "/auth/otp/verify",
  "/account/edit": "/account",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) return updateSession(request);
  const prefixedLocale = getLocaleFromPathname(pathname);
  if (prefixedLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(prefixedLocale.length + 1) || "/";
    const response = NextResponse.redirect(url);
    response.cookies.set("locale", prefixedLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 31536000,
    });
    return response;
  }
  const cookieLocale = request.cookies.get("locale")?.value;
  const locale =
    cookieLocale && hasLocale(cookieLocale)
      ? cookieLocale
      : matchPreferredLocale(request.headers.get("accept-language"));
  const destination = request.nextUrl.clone();
  const path = routeAliases[pathname] ?? pathname;
  destination.pathname = "/" + locale + (path === "/" ? "" : path);
  // Internal language routing only: the browser keeps Supaplate's original URLs.
  const response = await updateSession(request, destination);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
