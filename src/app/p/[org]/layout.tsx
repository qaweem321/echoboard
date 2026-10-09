import Link from "next/link";
import type { ReactNode } from "react";
import { brandStyle } from "@/components/portal/brand-style";
import { PortalLogo } from "@/components/portal/portal-logo";
import { PortalNav } from "@/components/portal/portal-nav";
import { absoluteUrl, siteConfig } from "@/config/site";
import { portalBase } from "@/lib/portal/links";
import { getPortal } from "@/lib/portal/queries";

type Props = { children: ReactNode; params: Promise<{ org: string }> };

export async function generateMetadata({ params }: Props) {
  const { org } = await params;
  const { organization } = await getPortal(org);
  return {
    title: { default: `${organization.name} feedback`, template: `%s · ${organization.name}` },
    description: `Share ideas and vote on what ${organization.name} builds next.`,
  };
}

// The public portal of one workspace, in its own colors and logo. No login needed.
export default async function PortalLayout({ children, params }: Props) {
  const { org } = await params;
  const { organization } = await getPortal(org);
  const base = await portalBase(organization.slug);

  return (
    <div className="min-h-screen flex flex-col" style={brandStyle(organization.brandColor)}>
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link href={base || "/"} aria-label={`${organization.name} feedback home`}>
            <PortalLogo name={organization.name} logoUrl={organization.logoUrl} />
          </Link>
          <PortalNav base={base} />
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8">{children}</main>
      {!organization.hidePoweredBy && (
        <footer className="py-6 text-center text-xs text-subtle-foreground">
          <a href={absoluteUrl("/")} className="hover:text-foreground">
            Powered by {siteConfig.name}
          </a>
        </footer>
      )}
    </div>
  );
}
