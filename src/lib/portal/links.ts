import { headers } from "next/headers";
import { absoluteUrl } from "@/config/site";
import { PORTAL_DOMAIN_HEADER } from "@/lib/custom-domain";

// Start of portal links on the current request: "" on the workspace's own domain
// (feedback.acme.com/roadmap), "/p/acme" on the app's domain (app.example.com/p/acme/roadmap).
export async function portalBase(slug: string) {
  return (await headers()).get(PORTAL_DOMAIN_HEADER) ? "" : `/p/${slug}`;
}

// A full link to a portal page for emails: on the workspace's own domain when it has one.
export function publicPortalUrl(
  organization: { slug: string; customDomain: string | null },
  path = "",
) {
  return organization.customDomain
    ? `https://${organization.customDomain}${path || "/"}`
    : absoluteUrl(`/p/${organization.slug}${path}`);
}
