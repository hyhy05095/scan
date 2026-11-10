import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { OtpVerifyForm } from "@/features/auth/components/otp-verify-form";
import { redirectAuthenticatedUser } from "@/features/auth/guards";
import { emailSchema } from "@/features/auth/schemas";
import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { auth } = await getDictionary(lang);
  return {
    title: auth.verifyCodeTitle,
    description: auth.verifyCodeDescription,
  };
}

export default async function OtpVerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const [{ lang }, { email }] = await Promise.all([params, searchParams]);
  if (!hasLocale(lang)) notFound();
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) redirect(localizePath(lang, "/auth/otp"));
  const [, { auth }] = await Promise.all([
    redirectAuthenticatedUser(lang),
    getDictionary(lang),
  ]);

  return (
    <AuthCard
      description={auth.verifyCodeDescription}
      homeHref={localizePath(lang)}
      title={auth.verifyCodeTitle}
    >
      <OtpVerifyForm email={parsedEmail.data} labels={auth} locale={lang} />
    </AuthCard>
  );
}
