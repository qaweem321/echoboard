import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

// Tells search engines what to crawl. Private, logged-in pages are kept out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/invite", "/api", "/reset-password", "/embed"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
