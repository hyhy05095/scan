import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AccountSection } from "@/features/account/components/account-section";
import { ChangeEmailForm } from "@/features/account/components/change-email-form";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";
import { DeleteAccountForm } from "@/features/account/components/delete-account-form";
import { ProfileForm } from "@/features/account/components/profile-form";
import { ProviderForm } from "@/features/account/components/provider-form";
import { getAccountData } from "@/features/account/data";
import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { account } = await getDictionary(lang);
  return { title: account.title, description: account.description };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dictionary, accountData] = await Promise.all([
    getDictionary(lang),
    getAccountData(),
  ]);
  if (!accountData) redirect(localizePath(lang, "/login"));
  const labels = dictionary.account;

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 pb-8">
      <div className="space-y-10">
        <AccountSection
          description={labels.profileDescription}
          title={labels.profileTitle}
        >
          <ProfileForm
            avatarUrl={accountData.avatarUrl}
            labels={labels}
            locale={lang}
            marketingConsent={accountData.marketingConsent}
            name={accountData.name}
          />
        </AccountSection>
        <AccountSection
          description={labels.emailDescription}
          title={labels.emailTitle}
        >
          <ChangeEmailForm
            email={accountData.email}
            labels={labels}
            locale={lang}
          />
        </AccountSection>
        <AccountSection
          description={hasPasswordDescription(accountData.hasPassword, labels)}
          title={
            accountData.hasPassword
              ? labels.changePasswordTitle
              : labels.addPasswordTitle
          }
        >
          <ChangePasswordForm
            hasPassword={accountData.hasPassword}
            labels={labels}
            locale={lang}
          />
        </AccountSection>
        <AccountSection
          description={labels.providersDescription}
          title={labels.providersTitle}
        >
          <ProviderForm
            connectedProviders={accountData.providers}
            labels={labels}
            locale={lang}
          />
        </AccountSection>
        <div className="[&>div]:border-red-500/20 [&>div]:bg-red-500/20">
          <AccountSection description="" title={labels.dangerTitle}>
            <DeleteAccountForm labels={labels} locale={lang} />
          </AccountSection>
        </div>
      </div>
    </main>
  );
}

function hasPasswordDescription(
  hasPassword: boolean,
  labels: Awaited<ReturnType<typeof getDictionary>>["account"],
) {
  return hasPassword
    ? labels.changePasswordDescription
    : labels.addPasswordDescription;
}
