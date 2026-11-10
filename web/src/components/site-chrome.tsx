"use client";

import { usePathname } from "next/navigation";

import { hasLocale } from "@/i18n/config";

export function SiteChrome({
  children,
  footer,
  header,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  header: React.ReactNode;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const routeRoot = hasLocale(segments[0] ?? "") ? segments[1] : segments[0];
  const usesDashboardShell =
    routeRoot === "dashboard" || routeRoot === "account";

  if (usesDashboardShell) {
    return children;
  }

  return (
    <>
      {header}
      <div className="flex flex-1 flex-col">{children}</div>
      {footer}
    </>
  );
}
