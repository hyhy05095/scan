import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";

import { appName } from "@/lib/app-config";
import { getSiteUrl } from "@/lib/site-url";
import { themeInitializer } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { AppIntegrations } from "@/components/app-integrations";
import { SiteChrome } from "@/components/site-chrome";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { TranslationProvider } from "@/i18n/provider";

import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return {};
  }

  const { footer } = await getDictionary(lang);
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: appName, template: "%s · " + appName },
    description: footer.description,
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dictionary = await getDictionary(lang);
  const themeCookie = (await cookies()).get("theme")?.value;
  // The default theme is dark. The inline initializer below refines this for
  // `system` preferences before the browser paints the document.
  const initialThemeClass = themeCookie === "light" ? "light" : "dark";

  return (
    <html
      className={cn(initialThemeClass, "font-sans", geist.variable)}
      lang={lang}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-initializer" strategy="beforeInteractive">
          {themeInitializer}
        </Script>
      </head>
      <body className="flex min-h-svh flex-col">
        <TranslationProvider locale={lang} messages={dictionary}>
          <Suspense fallback={null}>
            <AppIntegrations
              channelPluginKey={process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY}
              locale={lang}
            />
          </Suspense>
          <SiteChrome
            footer={<SiteFooter dictionary={dictionary} locale={lang} />}
            header={<SiteHeader dictionary={dictionary} locale={lang} />}
          >
            {children}
          </SiteChrome>
          {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ? (
            // Next.js loads GA after hydration and exposes sendGAEvent for custom events.
            // https://nextjs.org/docs/app/guides/third-party-libraries#google-analytics
            <GoogleAnalytics
              gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}
            />
          ) : null}
        </TranslationProvider>
      </body>
    </html>
  );
}
