import { createHmac } from "node:crypto";
import { resolve4, resolveCname, resolveTxt } from "node:dns/promises";

export type DnsStatus = "ok" | "not-pointing" | "not-found";

// Whether a custom domain already points at this app: a CNAME to the app's host, or the same
// IP addresses. Only a hint for the person setting it up; the domain works once DNS is right.
export async function checkDomainDns(domain: string, appHost: string): Promise<DnsStatus> {
  try {
    const names = await resolveCname(domain).catch(() => [] as string[]);
    if (names.some((name) => name.replace(/\.$/, "").toLowerCase() === appHost)) {
      return "ok";
    }
    const [domainIps, appIps] = await Promise.all([resolve4(domain), resolve4(appHost)]);
    return domainIps.some((ip) => appIps.includes(ip)) ? "ok" : "not-pointing";
  } catch {
    return "not-found";
  }
}

export type DomainVerification = { name: string; value: string };

// The TXT record that proves a workspace controls a domain. Pointing a domain at the app isn't
// proof on its own: on shared hosting many unrelated sites have the same IP addresses. The value
// is derived from a server secret, so only this workspace is shown it, and it changes per domain.
export function domainVerification(
  organizationId: string,
  domain: string,
  secret = process.env.BETTER_AUTH_SECRET ?? "",
): DomainVerification {
  const token = createHmac("sha256", secret)
    .update(`custom-domain:${organizationId}:${domain}`)
    .digest("base64url")
    .slice(0, 32);
  return { name: `_portal-verify.${domain}`, value: `portal-verify=${token}` };
}

export async function hasVerificationRecord({ name, value }: DomainVerification) {
  try {
    const records = await resolveTxt(name);
    return records.some((parts) => parts.join("") === value);
  } catch {
    return false;
  }
}
