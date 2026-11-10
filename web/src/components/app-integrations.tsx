"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import NProgress from "nprogress";
import { useEffect } from "react";
import { Toaster } from "sonner";

import type { Locale } from "@/i18n/config";

const channelSnippet =
  '(function(){var w=window;if(w.ChannelIO){return;}var ch=function(){ch.c(arguments);};ch.q=[];ch.c=function(args){ch.q.push(args);};w.ChannelIO=ch;function l(){if(w.ChannelIOInitialized){return;}w.ChannelIOInitialized=true;var s=document.createElement("script");s.type="text/javascript";s.async=true;s.src="https://cdn.channel.io/plugin/ch-plugin-web.js";var x=document.getElementsByTagName("script")[0];if(x.parentNode){x.parentNode.insertBefore(s,x);}}if(document.readyState==="complete"){l();}else{w.addEventListener("DOMContentLoaded",l);w.addEventListener("load",l);}})();';

export function AppIntegrations({
  channelPluginKey,
}: {
  channelPluginKey?: string;
  locale: Locale;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    NProgress.done();
  }, [pathname, search]);
  useEffect(() => {
    NProgress.configure({ showSpinner: true });
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !target ||
        target.target === "_blank" ||
        target.hasAttribute("download")
      )
        return;
      const next = new URL(target.href);
      if (
        next.origin === location.origin &&
        next.pathname + next.search !== location.pathname + location.search
      )
        NProgress.start();
    };
    const onPopState = () => NProgress.start();
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      NProgress.done();
    };
  }, []);
  return (
    <>
      {channelPluginKey ? (
        <Script id="channel-io">
          {channelSnippet +
            "ChannelIO('boot'," +
            JSON.stringify({ pluginKey: channelPluginKey }).replaceAll(
              "<",
              "\\u003c",
            ) +
            ");"}
        </Script>
      ) : null}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
