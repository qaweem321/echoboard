"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getPlanLimits } from "@/lib/billing";
import { checkLogoUrl, normalizeDomain, normalizeHexColor } from "@/lib/branding";
import { appHostName } from "@/lib/custom-domain";
import { DEMO_DISABLED_MESSAGE, isDemoMode } from "@/lib/demo";
import { checkDomainDns, type DnsStatus } from "@/lib/portal/dns-check";
import { refreshPortal } from "@/lib/portal/refresh";
import { requirePermission } from "@/lib/session";

function refresh(slug: string) {
  revalidatePath(`/dashboard/${slug}/branding`);
  refreshPortal(slug);
}

export type BrandingState = { error?: string; saved?: boolean };

export async function saveBranding(
  _previous: BrandingState,
  formData: FormData,
): Promise<BrandingState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "organization:update");

  const color = normalizeHexColor(formData.get("brandColor"));
  if ("error" in color) {
    return color;
  }
  const logo = checkLogoUrl(formData.get("logoUrl"));
  if ("error" in logo) {
    return logo;
  }
  const hidePoweredBy = formData.get("hidePoweredBy") === "on";
  if (hidePoweredBy && !(await getPlanLimits(organization.id)).removeBranding) {
    return { error: 'Hiding "Powered by" is a Pro feature. Upgrade under Billing.' };
  }
  await db
    .update(organizations)
    .set({ brandColor: color.color, logoUrl: logo.url, hidePoweredBy })
    .where(eq(organizations.id, organization.id));
  refresh(slug);
  return { saved: true };
}

export type DomainState = { error?: string; saved?: boolean; dns?: DnsStatus };

export async function saveDomain(_previous: DomainState, formData: FormData): Promise<DomainState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "organization:update");
  const host = appHostName();

  // Anyone can sign up to a public demo; they mustn't be able to claim real domains.
  if (isDemoMode()) {
    return { error: DEMO_DISABLED_MESSAGE };
  }
  const checked = normalizeDomain(formData.get("customDomain"), host);
  if ("error" in checked) {
    return checked;
  }
  if (checked.domain) {
    const [plan, taken] = await Promise.all([
      getPlanLimits(organization.id),
      db.$count(
        organizations,
        and(eq(organizations.customDomain, checked.domain), ne(organizations.id, organization.id)),
      ),
    ]);
    if (!plan.customDomain) {
      return { error: "Custom domains are a Pro feature. Upgrade under Billing." };
    }
    if (taken > 0) {
      return { error: "Another workspace already uses that domain." };
    }
    // Only whoever controls the domain's DNS can point it here, so this stops people claiming
    // a domain that isn't theirs. Skipped while developing (test domains have no DNS).
    if (process.env.NODE_ENV === "production") {
      const dns = await checkDomainDns(checked.domain, host);
      if (dns !== "ok") {
        return {
          dns,
          error: `First add a CNAME record pointing ${checked.domain} to ${host}, then save again.`,
        };
      }
    }
  }
  await db
    .update(organizations)
    .set({ customDomain: checked.domain })
    .where(eq(organizations.id, organization.id));
  refresh(slug);
  return {
    saved: true,
    dns: checked.domain ? await checkDomainDns(checked.domain, host) : undefined,
  };
}
