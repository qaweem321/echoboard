import Link from "next/link";
import type { ReactNode } from "react";
import { PortalNav } from "@/components/portal/portal-nav";
import { siteConfig } from "@/config/site";
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

// The public portal of one workspace. No login needed.
export default async function PortalLayout({ children, params }: Props) {
  const { org } = await params;
  const { organization } = await getPortal(org);
  const base = `/p/${organization.slug}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link href={base} className="text-lg font-bold">
            {organization.name}
          </Link>
          <PortalNav
            items={[
              { label: "Feedback", href: base },
              { label: "Roadmap", href: `${base}/roadmap` },
              { label: "Changelog", href: `${base}/changelog` },
            ]}
          />
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8">{children}</main>
      <footer className="py-6 text-center text-xs text-subtle-foreground">
        Powered by {siteConfig.name}
      </footer>
    </div>
  );
}
