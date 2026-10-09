// A workspace's portal can be served on its own domain, e.g. feedback.acme.com instead of
// app.example.com/p/acme. src/proxy.ts rewrites those requests with this function.

// Set by the proxy on custom-domain requests, so portal pages build links without "/p/<slug>".
export const PORTAL_DOMAIN_HEADER = "x-portal-domain";

// Shared files and endpoints that work the same on every domain.
const SHARED_PATHS = [
  "/_next",
  "/api",
  "/embed",
  "/widget.js",
  "/unsubscribe",
  "/favicon.ico",
  "/icon.svg",
  "/robots.txt",
];

function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// Where a custom-domain request should go inside the app, or null to serve it unchanged.
// Everything else (dashboard, login, other workspaces' portals) lands under this workspace's
// portal, where it doesn't exist: a 404, never another workspace's data.
export function customDomainPath(pathname: string, slug: string) {
  if (SHARED_PATHS.some((prefix) => isUnder(pathname, prefix))) {
    return null;
  }
  if (isUnder(pathname, `/p/${slug}`)) {
    return null;
  }
  return `/p/${slug}${pathname === "/" ? "" : pathname}`;
}

// "Feedback.Acme.com:443" -> "feedback.acme.com"
export function hostName(host: string | null) {
  return (host ?? "").split(":")[0].toLowerCase();
}

// The app's own host name, from BETTER_AUTH_URL (e.g. "app.example.com").
export function appHostName() {
  return hostName(new URL(process.env.BETTER_AUTH_URL ?? "http://localhost").host);
}
