import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FreshOnBack } from "@/components/fresh-on-back";
import { ThemeSync } from "@/components/theme";
import { siteConfig } from "@/config/site";
import { themeScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name}: ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // Turns relative image paths (like the generated preview image) into full URLs.
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  openGraph: { type: "website", siteName: siteConfig.name },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: our own constant script; it sets the theme before paint to avoid a flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeSync />
        <FreshOnBack />
        {children}
      </body>
    </html>
  );
}
