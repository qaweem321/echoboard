import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { similarSearchQuery } from "./similar-query";

const LIMIT = 5;

// Existing ideas whose titles share words with the typed title, best matches first, so people
// vote for an existing idea instead of posting a duplicate. Uses the title search index.
export async function findSimilarPosts(organizationId: string, text: string) {
  const query = similarSearchQuery(text);
  if (!query) {
    return [];
  }
  const vector = sql`to_tsvector('english', ${posts.title})`;
  const tsQuery = sql`to_tsquery('english', ${query})`;
  return db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      voteCount: posts.voteCount,
    })
    .from(posts)
    .where(
      and(
        eq(posts.organizationId, organizationId),
        isNull(posts.mergedIntoId),
        ne(posts.status, "closed"),
        sql`${vector} @@ ${tsQuery}`,
      ),
    )
    .orderBy(desc(sql`ts_rank(${vector}, ${tsQuery})`), desc(posts.voteCount))
    .limit(LIMIT);
}
