import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSafeNextPath } from "@/lib/site-url";

import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { redirectAuthenticatedUser } from "@/features/auth/guards";
import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return {};
  }

  const [, { auth }] = await Promise.all([
    redirectAuthenticatedUser(lang),
    getDictionary(lang),
  ]);
  return { title: auth.loginTitle, description: auth.loginDescription };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
}) {
  const [{ lang }, { error, next }] = await Promise.all([params, searchParams]);

  if (!hasLocale(lang)) {
    notFound();
  }

  const { auth } = await getDictionary(lang);
  const nextPath = getSafeNextPath(
    Array.isArray(next) ? (next[0] ?? null) : (next ?? null),
    localizePath(lang, "/"),
  );

  return (
    <AuthCard
      description={auth.loginDescription}
      homeHref={localizePath(lang)}
      title={auth.loginTitle}
    >
      {error === "confirmation" ? (
        <p
          className="bg-destructive/10 text-destructive mb-5 rounded-lg p-3 text-sm"
          role="alert"
        >
          {auth.invalidConfirmation}
        </p>
      ) : null}
      {error === "social" ? (
        <p
          className="bg-destructive/10 text-destructive mb-5 rounded-lg p-3 text-sm"
          role="alert"
        >
          {auth.socialLoginFailed}
        </p>
      ) : null}
      <LoginForm labels={auth} locale={lang} nextPath={nextPath} />
    </AuthCard>
  );
}
