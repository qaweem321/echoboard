import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";

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
    .select({ slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.customDomain, domain))
    .limit(1);
  if (cache.size >= CACHE_LIMIT) {
    cache.clear();
  }
  cache.set(domain, { slug: row?.slug ?? null, expires: Date.now() + CACHE_MS });
  return row?.slug ?? null;
}
