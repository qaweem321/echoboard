import { resolve4, resolveCname } from "node:dns/promises";

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
