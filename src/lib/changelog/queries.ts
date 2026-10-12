import { and, desc, eq, isNotNull, isNull, ne, type SQL, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { qualified } from "@/db/qualified";
import { changelogEntries, changelogEntryPosts, posts } from "@/db/schema";
import type { PostStatus } from "@/lib/post-status";
import { isUuid } from "@/lib/uuid";

export const CHANGELOG_PAGE_SIZE = 10;

// The ideas an entry announces, as a JSON list inside the same query (no extra round trip).
const linkedPosts = sql<{ id: string; title: string; status: PostStatus }[]>`coalesce((
  select json_agg(json_build_object('id', p.id, 'title', p.title, 'status', p.status) order by p.title)
  from ${changelogEntryPosts} as l inner join ${posts} as p on p.id = l.post_id
  where l.entry_id = ${qualified(changelogEntries.id)}
), '[]'::json)`;

const entryFields = {
  id: changelogEntries.id,
  title: changelogEntries.title,
  body: changelogEntries.body,
  publishedAt: changelogEntries.publishedAt,
  createdAt: changelogEntries.createdAt,
  posts: linkedPosts,
};

// The portal shows published entries only; the team also sees drafts (newest first).
export async function listEntries(organizationId: string, publishedOnly: boolean, page: number) {
  const filters: SQL[] = [eq(changelogEntries.organizationId, organizationId)];
  if (publishedOnly) {
    filters.push(isNotNull(changelogEntries.publishedAt));
  }
  const rows = await db
    .select(entryFields)
    .from(changelogEntries)
    .where(and(...filters))
    // Drafts (no publish date) first for the team, then newest published.
    .orderBy(
      sql`${changelogEntries.publishedAt} desc nulls first`,
      desc(changelogEntries.createdAt),
    )
    .limit(CHANGELOG_PAGE_SIZE + 1)
    .offset((page - 1) * CHANGELOG_PAGE_SIZE);
  return {
    entries: rows.slice(0, CHANGELOG_PAGE_SIZE),
    hasMore: rows.length > CHANGELOG_PAGE_SIZE,
  };
}

export type ChangelogEntry = Awaited<ReturnType<typeof listEntries>>["entries"][number];

// Cached for the request, so the page title and the page share one load.
export const getEntry = cache(async function getEntry(
  organizationId: string,
  entryId: string,
  publishedOnly: boolean,
) {
  if (!isUuid(entryId)) {
    notFound();
  }
  const [entry] = await db
    .select(entryFields)
    .from(changelogEntries)
    .where(
      and(
        eq(changelogEntries.id, entryId),
        eq(changelogEntries.organizationId, organizationId),
        publishedOnly ? isNotNull(changelogEntries.publishedAt) : undefined,
      ),
    )
    .limit(1);
  if (!entry) {
    notFound();
  }
  return entry;
});

const LINKABLE_LIMIT = 200;

// Ideas the team may link to an entry: everything except closed ideas (an idea can ship
// straight from Open), roadmap ideas first, then most-voted.
export async function listLinkablePosts(organizationId: string) {
  return db
    .select({ id: posts.id, title: posts.title, status: posts.status })
    .from(posts)
    .where(
      and(
        eq(posts.organizationId, organizationId),
        isNull(posts.mergedIntoId),
        ne(posts.status, "closed"),
      ),
    )
    .orderBy(
      sql`${posts.status} in ('planned', 'in_progress', 'complete') desc`,
      desc(posts.voteCount),
    )
    .limit(LINKABLE_LIMIT);
}
