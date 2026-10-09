import { hostName } from "@/lib/custom-domain";
import { workspaceForDomain } from "@/lib/portal/domain-lookup";

// For Caddy's on-demand HTTPS (deploy/Caddyfile): Caddy asks here before getting a certificate
// for a new domain, so certificates are only issued for domains a workspace actually uses.
export async function GET(request: Request) {
  const domain = hostName(new URL(request.url).searchParams.get("domain"));
  const slug = domain ? await workspaceForDomain(domain) : null;
  return new Response(null, { status: slug ? 200 : 404 });
}
