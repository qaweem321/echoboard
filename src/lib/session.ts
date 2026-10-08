import { getSessionCookie } from "better-auth/cookies";
import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

export const requireUser = cache(async () => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    // Session expired: log in again, then come back to the same page (set by src/proxy.ts).
    const path = requestHeaders.get("x-pathname");
    redirect(path ? `/login?next=${encodeURIComponent(path)}` : "/login");
  }
  return session.user;
});

// For the login, signup and forgot-password pages: logged-in users go to their dashboard.
// Logged-out visitors have no session cookie, so they skip the database check entirely.
export async function redirectIfLoggedIn() {
  const requestHeaders = await headers();
  if (!getSessionCookie(requestHeaders)) {
    return;
  }
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session) {
    redirect("/dashboard");
  }
}

export async function getUserOrganizations(userId: string) {
  return db
    .select({ name: organizations.name, slug: organizations.slug, role: memberships.role })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(organizations.name));
}

export const requireMembership = cache(async (slug: string) => {
  const user = await requireUser();

  const [membership] = await db
    .select({ organization: organizations, role: memberships.role })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(and(eq(organizations.slug, slug), eq(memberships.userId, user.id)))
    .limit(1);

  if (!membership) {
    notFound();
  }
  return { user, organization: membership.organization, role: membership.role };
});

export async function requirePermission(slug: string, permission: Permission) {
  const membership = await requireMembership(slug);
  if (!can(membership.role, permission)) {
    throw new Error("You don't have permission to do that.");
  }
  return membership;
}
