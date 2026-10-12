import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { atomic } from "@/db/atomic";
import { comments, posts, votes } from "@/db/schema";
import { lockPosts, recountComments, recountVotes } from "./counts";

// Merges a duplicate post into the main one, in one transaction:
// its voters also vote for the main post (once each), its comments move over, posts merged
// into the duplicate earlier now point at the main post, and the counts are refreshed.
// The duplicate stays (hidden) so old links redirect to the main post.
// Both posts must already be checked to belong to the same workspace.
// Returns false when one of them was merged meanwhile (then nothing changes): merging A into B
// and B into A at the same moment would otherwise make each redirect to the other forever.
export async function mergePosts(duplicateId: string, mainId: string) {
  // Checked by every change below, after both posts are locked, so it sees a merge that another
  // request finished a moment ago.
  const neitherMerged = sql`not exists (select 1 from posts p where p.id in (${duplicateId}::uuid, ${mainId}::uuid) and p.merged_into_id is not null)`;
  await atomic((tx) => [
    lockPosts(tx, [duplicateId, mainId]),
    tx
      .insert(votes)
      .select(
        tx
          .select({
            id: sql<string>`gen_random_uuid()`.as("id"),
            postId: sql<string>`${mainId}::uuid`.as("post_id"),
            voterId: votes.voterId,
            createdAt: votes.createdAt,
          })
          .from(votes)
          .where(and(eq(votes.postId, duplicateId), neitherMerged)),
      )
      .onConflictDoNothing(),
    tx
      .update(comments)
      .set({ postId: mainId })
      .where(and(eq(comments.postId, duplicateId), neitherMerged)),
    tx
      .update(posts)
      .set({ mergedIntoId: mainId })
      .where(and(eq(posts.mergedIntoId, duplicateId), neitherMerged)),
    tx
      .update(posts)
      .set({ mergedIntoId: mainId, updatedAt: new Date() })
      .where(and(eq(posts.id, duplicateId), neitherMerged)),
    tx
      .update(posts)
      .set({ voteCount: recountVotes, commentCount: recountComments })
      .where(inArray(posts.id, [duplicateId, mainId])),
  ]);
  const [duplicate] = await db
    .select({ mergedIntoId: posts.mergedIntoId })
    .from(posts)
    .where(eq(posts.id, duplicateId));
  return duplicate?.mergedIntoId === mainId;
}
