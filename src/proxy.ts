import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { LAST_ORGANIZATION_COOKIE, organizationSlugFromPath } from "@/lib/last-organization";

// Runs before private pages render. Visitors without a login cookie go to the login page,
// which sends them back here after they log in. This is a fast cookie check only; the
// real session check still happens in requireUser().
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname + request.nextUrl.search;

  if (!getSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Tell the page which URL was requested, so requireUser() can send an expired session
  // back to the same page after logging in again.
  const requestHeaders = new Headers(request.headers);
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
  matcher: ["/dashboard/:path*", "/onboarding"],
};
