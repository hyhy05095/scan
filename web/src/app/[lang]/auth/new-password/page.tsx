import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { AuthCard } from "@/features/auth/components/auth-card";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";
import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return {};
  }

  const { auth } = await getDictionary(lang);
  return {
    title: auth.newPasswordTitle,
    description: auth.newPasswordDescription,
  };
}

export default async function NewPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const [dictionary, supabase] = await Promise.all([
    getDictionary(lang),
    createClient(),
  ]);
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    redirect(localizePath(lang, "/auth/forgot-password"));
  }

  return (
    <AuthCard
      description={dictionary.auth.newPasswordDescription}
      homeHref={localizePath(lang)}
      title={dictionary.auth.newPasswordTitle}
    >
      <NewPasswordForm labels={dictionary.auth} locale={lang} />
    </AuthCard>
  );
}
