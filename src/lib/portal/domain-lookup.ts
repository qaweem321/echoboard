import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
import { effectivePlan, plans } from "@/lib/billing/plans";

// Remembers each domain's workspace for a minute, so the proxy doesn't query the database on
// every request. A changed domain takes effect within a minute.
const CACHE_MS = 60_000;
const CACHE_LIMIT = 1000;
const cache = new Map<string, { slug: string | null; expires: number }>();

// The slug of the workspace that uses this domain, or null if none does.
export async function workspaceForDomain(domain: string) {
  const cached = cache.get(domain);
  if (cached && cached.expires > Date.now()) {
    return cached.slug;
  }
  const [row] = await db
    .select({ slug: organizations.slug, status: subscriptions.status })
    .from(organizations)
    .leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id))
    .where(eq(organizations.customDomain, domain))
    .limit(1);
  // Custom domains are a paid feature: a workspace that left Pro stops being served on it.
  const slug = row && plans[effectivePlan(row.status)].customDomain ? row.slug : null;
  if (cache.size >= CACHE_LIMIT) {
    // Drop the oldest entry (a Map keeps insertion order), so a flood of unknown host names
    // can't keep emptying the cache for real domains.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(domain, { slug, expires: Date.now() + CACHE_MS });
  return slug;
}
