import { sql } from "drizzle-orm";
import { qualified } from "@/db/qualified";
import { comments, posts, votes } from "@/db/schema";

// Set posts.vote_count / comment_count from the rows themselves. Used in the same atomic() batch
// (one transaction) as the change, so the stored counts can never drift.
export const recountVotes = sql<number>`(select count(*)::int from ${votes} where ${votes.postId} = ${qualified(posts.id)})`;
export const recountComments = sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${qualified(posts.id)})`;
