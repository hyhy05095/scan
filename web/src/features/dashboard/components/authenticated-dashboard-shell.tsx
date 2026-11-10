import { redirect } from "next/navigation";

import { getAccountData } from "@/features/account/data";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { type Locale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function AuthenticatedDashboardShell({
  children,
  locale,
  returnPath,
}: {
  children: React.ReactNode;
  locale: Locale;
  returnPath: string;
}) {
  const [accountData, dictionary] = await Promise.all([
    getAccountData(),
    getDictionary(locale),
  ]);
  if (!accountData)
    redirect(
      `${localizePath(locale, "/login")}?next=${encodeURIComponent(localizePath(locale, returnPath))}`,
    );

  return (
    <DashboardShell
      labels={dictionary.dashboardShell}
      locale={locale}
      user={{
        avatarUrl: accountData.avatarUrl,
        email: accountData.email,
        name: accountData.name,
      }}
    >
      {children}
    </DashboardShell>
  );
}
