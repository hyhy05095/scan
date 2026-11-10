import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/account", "/dashboard", "/debug", "/payments"];

  return {
    rules: {
      allow: "/",
      disallow: ["/api/", ...privatePaths],
      userAgent: "*",
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
