"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getPlanLimits } from "@/lib/billing";
import { checkLogoUrl, normalizeDomain, normalizeHexColor } from "@/lib/branding";
import { appHostName } from "@/lib/custom-domain";
import { isUniqueViolation } from "@/lib/db-errors";
import {
  checkDomainDns,
  type DnsStatus,
  type DomainVerification,
  domainVerification,
  hasVerificationRecord,
} from "@/lib/portal/dns-check";
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

export type DomainState = {
  error?: string;
  saved?: boolean;
  dns?: DnsStatus;
  // The TXT record still to add, shown while the domain isn't verified yet.
  verify?: DomainVerification;
};

export async function saveDomain(_previous: DomainState, formData: FormData): Promise<DomainState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "organization:update");
  const host = appHostName();

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
    // Only whoever controls the domain's DNS can add the TXT record, so nobody can claim a
    // domain that isn't theirs. Skipped while developing (test domains have no DNS).
    if (process.env.NODE_ENV === "production") {
      const verify = domainVerification(organization.id, checked.domain);
      const [owned, dns] = await Promise.all([
        hasVerificationRecord(verify),
        checkDomainDns(checked.domain, host),
      ]);
      if (!owned) {
        return {
          dns,
          verify,
          error: "To show the domain is yours, add the TXT record below, then save again.",
        };
      }
      if (dns !== "ok") {
        return {
          dns,
          error: `First add a CNAME record pointing ${checked.domain} to ${host}, then save again.`,
        };
      }
      return saveCustomDomain(slug, organization.id, checked.domain, dns);
    }
  }
  return saveCustomDomain(
    slug,
    organization.id,
    checked.domain,
    checked.domain ? await checkDomainDns(checked.domain, host) : undefined,
  );
}

async function saveCustomDomain(
  slug: string,
  organizationId: string,
  domain: string | null,
  dns: DnsStatus | undefined,
): Promise<DomainState> {
  try {
    await db
      .update(organizations)
      .set({ customDomain: domain })
      .where(eq(organizations.id, organizationId));
  } catch (error) {
    // Another workspace saved the same domain at the same moment.
    if (isUniqueViolation(error)) {
      return { error: "Another workspace already uses that domain." };
    }
    throw error;
  }
  refresh(slug);
  return { saved: true, dns };
}
