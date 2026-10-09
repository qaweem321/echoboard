import type { Metadata } from "next";
import { appHostName } from "@/lib/custom-domain";
import { can } from "@/lib/permissions";
import { publicPortalUrl } from "@/lib/portal/links";
import { requireMembership } from "@/lib/session";
import { BrandingForm } from "./branding-form";
import { DomainForm } from "./domain-form";

export const metadata: Metadata = { title: "Branding" };

export default async function BrandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization, role } = await requireMembership(slug);
  const canEdit = can(role, "organization:update");
  const portalUrl = publicPortalUrl(organization);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Branding</h1>
        <p className="mt-1 text-muted-foreground">
          Make your public portal and widget look like your own product. Your portal is at{" "}
          <a href={portalUrl} target="_blank" rel="noopener" className="text-link hover:underline">
            {portalUrl.replace(/^https?:\/\//, "")}
          </a>
          .
        </p>
        {!canEdit && (
          <p className="mt-2 text-sm text-subtle-foreground">
            Only owners and admins can change these settings.
          </p>
        )}
      </div>

      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-4 font-semibold">Look and feel</h2>
        <BrandingForm
          slug={slug}
          brandColor={organization.brandColor}
          logoUrl={organization.logoUrl}
          hidePoweredBy={organization.hidePoweredBy}
          canEdit={canEdit}
        />
      </section>

      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-1 font-semibold">Custom domain</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Show your portal on your own address, like feedback.yourcompany.com.
        </p>
        <DomainForm
          slug={slug}
          customDomain={organization.customDomain}
          appHost={appHostName()}
          canEdit={canEdit}
        />
      </section>
    </div>
  );
}
