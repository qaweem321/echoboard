import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { atomic } from "@/db/atomic";
import { posts, votes } from "@/db/schema";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { isUuid } from "@/lib/uuid";
import { recountVotes } from "./counts";

// What portal and widget visitors can do. Callers check the workspace and the voter first.

// Visitor actions are public, so each is limited per IP address and workspace.
export const visitorLimits = {
  vote: { max: 60, seconds: 60 },
  post: { max: 5, seconds: 600 },
  comment: { max: 10, seconds: 600 },
} as const;

export async function withinVisitorLimit(
  action: keyof typeof visitorLimits,
  organizationId: string,
) {
  const ip = clientIp(await headers());
  const { max, seconds } = visitorLimits[action];
  return (await rateLimit(`${action}:${organizationId}:${ip}`, max, seconds)).allowed;
}

// The post if it exists in this workspace (IDs come from the browser), else null. A post merged
// into another counts as gone: a vote or comment there would be hidden from everyone.
export async function findWorkspacePost(organizationId: string, postId: unknown) {
  if (!isUuid(postId)) {
    return null;
  }
  const [post] = await db
    .select({ id: posts.id, title: posts.title, status: posts.status })
    .from(posts)
    .where(
      and(
        eq(posts.id, postId),
        eq(posts.organizationId, organizationId),
        isNull(posts.mergedIntoId),
      ),
    )
    .limit(1);
  return post ?? null;
}

// Adds or removes a vote. Saying which (instead of toggling) means a repeated request
// changes nothing. The stored count is recounted in the same transaction.
export async function castVote(postId: string, voterId: string, intent: "add" | "remove") {
  await atomic((tx) => [
    intent === "remove"
      ? tx.delete(votes).where(and(eq(votes.postId, postId), eq(votes.voterId, voterId)))
      : tx.insert(votes).values({ postId, voterId }).onConflictDoNothing(),
    tx.update(posts).set({ voteCount: recountVotes }).where(eq(posts.id, postId)),
  ]);
}

type NewIdea = {
  organizationId: string;
  boardId: string;
  title: string;
  body: string | null;
  // The voter who votes for it (always), and who wrote it unless a team member did.
  voterId: string;
  authorUserId: string | null;
};

// Saves a new idea with its author's vote, in one transaction. Returns the new post's ID.
export async function submitIdea(idea: NewIdea) {
  const postId = randomUUID();
  await atomic((tx) => [
    tx.insert(posts).values({
      id: postId,
      organizationId: idea.organizationId,
      boardId: idea.boardId,
      title: idea.title,
      body: idea.body,
      voteCount: 1,
      authorUserId: idea.authorUserId,
      authorVoterId: idea.authorUserId ? null : idea.voterId,
    }),
    tx.insert(votes).values({ postId, voterId: idea.voterId }),
  ]);
  return postId;
}
