import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { OtpStartForm } from "@/features/auth/components/otp-start-form";
import { redirectAuthenticatedUser } from "@/features/auth/guards";
import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const [, { auth }] = await Promise.all([
    redirectAuthenticatedUser(lang),
    getDictionary(lang),
  ]);
  return { title: auth.otpTitle, description: auth.otpDescription };
}

export default async function OtpPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { auth } = await getDictionary(lang);

  return (
    <AuthCard
      description={auth.otpDescription}
      homeHref={localizePath(lang)}
      title={auth.otpTitle}
    >
      <OtpStartForm labels={auth} locale={lang} />
    </AuthCard>
  );
}
