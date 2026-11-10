import { notFound } from "next/navigation";

import { AuthenticatedDashboardShell } from "@/features/dashboard/components/authenticated-dashboard-shell";
import { hasLocale } from "@/i18n/config";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <AuthenticatedDashboardShell locale={lang} returnPath="/dashboard">
      {children}
    </AuthenticatedDashboardShell>
  );
}
