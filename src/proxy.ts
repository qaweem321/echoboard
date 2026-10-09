import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { appHostName, customDomainPath, hostName, PORTAL_DOMAIN_HEADER } from "@/lib/custom-domain";
import { LAST_ORGANIZATION_COOKIE, organizationSlugFromPath } from "@/lib/last-organization";
import { workspaceForDomain } from "@/lib/portal/domain-lookup";

const appHost = appHostName();

// Runs before every page and API request.
export async function proxy(request: NextRequest) {
  // Only this proxy may say a request came in on a custom domain.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(PORTAL_DOMAIN_HEADER);

  const host = hostName(request.headers.get("host"));
  if (host && host !== appHost) {
    const slug = await workspaceForDomain(host);
    if (slug) {
      return serveCustomDomain(request, requestHeaders, host, slug);
    }
  }

  const { pathname } = request.nextUrl;
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/onboarding"
  ) {
    return protectPrivatePage(request, requestHeaders);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

// feedback.acme.com/roadmap shows /p/acme/roadmap; nothing outside the portal is reachable.
function serveCustomDomain(
  request: NextRequest,
  requestHeaders: Headers,
  host: string,
  slug: string,
) {
  requestHeaders.set(PORTAL_DOMAIN_HEADER, host);
  const path = customDomainPath(request.nextUrl.pathname, slug);
  if (!path) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const url = request.nextUrl.clone();
  url.pathname = path;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

// Visitors without a login cookie go to the login page, which sends them back here after they
// log in. This is a fast cookie check only; the real session check is in requireUser().
function protectPrivatePage(request: NextRequest, requestHeaders: Headers) {
  const path = request.nextUrl.pathname + request.nextUrl.search;

  if (!getSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Tell the page which URL was requested, so requireUser() can send an expired session
  // back to the same page after logging in again.
  requestHeaders.set("x-pathname", path);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Remember which organization was opened, so the next login goes straight back to it.
  const slug = organizationSlugFromPath(request.nextUrl.pathname);
  if (slug && request.cookies.get(LAST_ORGANIZATION_COOKIE)?.value !== slug) {
    response.cookies.set(LAST_ORGANIZATION_COOKIE, slug, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}

export const config = {
  // Everything except Next.js build files and images.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
