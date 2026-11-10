import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
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
  return {
    title: auth.forgotPasswordTitle,
    description: auth.forgotPasswordDescription,
  };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const { auth } = await getDictionary(lang);

  return (
    <AuthCard
      description={auth.forgotPasswordDescription}
      homeHref={localizePath(lang)}
      title={auth.forgotPasswordTitle}
    >
      <ForgotPasswordForm labels={auth} locale={lang} />
    </AuthCard>
  );
}
