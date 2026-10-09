import { eq, inArray, sql } from "drizzle-orm";
import { atomic } from "@/db/atomic";
import { comments, posts, votes } from "@/db/schema";
import { recountComments, recountVotes } from "./counts";

// Merges a duplicate post into the main one, in one transaction:
// its voters also vote for the main post (once each), its comments move over, posts merged
// into the duplicate earlier now point at the main post, and the counts are refreshed.
// The duplicate stays (hidden) so old links redirect to the main post.
// Both posts must already be checked to belong to the same workspace.
export async function mergePosts(duplicateId: string, mainId: string) {
  await atomic((tx) => [
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
          .where(eq(votes.postId, duplicateId)),
      )
      .onConflictDoNothing(),
    tx.update(comments).set({ postId: mainId }).where(eq(comments.postId, duplicateId)),
    tx.update(posts).set({ mergedIntoId: mainId }).where(eq(posts.mergedIntoId, duplicateId)),
    tx
      .update(posts)
      .set({ mergedIntoId: mainId, updatedAt: new Date() })
      .where(eq(posts.id, duplicateId)),
    tx
      .update(posts)
      .set({ voteCount: recountVotes, commentCount: recountComments })
      .where(inArray(posts.id, [duplicateId, mainId])),
  ]);
}
