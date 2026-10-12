import { asc, inArray, sql } from "drizzle-orm";
import type { db } from "@/db";
import { qualified } from "@/db/qualified";
import { comments, posts, votes } from "@/db/schema";

// Set posts.vote_count / comment_count from the rows themselves. Used in the same atomic() batch
// (one transaction) as the change, so the stored counts can never drift.
export const recountVotes = sql<number>`(select count(*)::int from ${votes} where ${votes.postId} = ${qualified(posts.id)})`;
export const recountComments = sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${qualified(posts.id)})`;

// The first statement of such a batch: locks the posts until the transaction ends. Without it,
// two votes at the same moment each recount without seeing the other's (not yet saved) vote, and
// the count ends up one too low. With it, the second waits, then counts both. Ordered by id, so
// two batches locking the same posts can't wait on each other forever.
export function lockPosts(tx: typeof db, postIds: string[]) {
  return tx
    .select({ id: posts.id })
    .from(posts)
    .where(inArray(posts.id, postIds))
    .orderBy(asc(posts.id))
    .for("update");
}
