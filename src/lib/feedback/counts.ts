import { sql } from "drizzle-orm";
import { comments, posts, votes } from "@/db/schema";

// Set posts.vote_count / comment_count from the rows themselves. Used in the same db.batch
// (one transaction) as the change, so the stored counts can never drift.
export const recountVotes = sql<number>`(select count(*)::int from ${votes} where ${votes.postId} = ${posts.id})`;
export const recountComments = sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${posts.id})`;
