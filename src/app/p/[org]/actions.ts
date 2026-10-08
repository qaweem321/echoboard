"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { comments, posts, votes } from "@/db/schema";
import { clientIp } from "@/lib/client-ip";
import { recountComments, recountVotes } from "@/lib/feedback/counts";
import { checkCommentInput, checkPostInput, checkVoterDetails } from "@/lib/feedback-input";
import { getPortal, getTeamViewer } from "@/lib/portal/queries";
import { refreshPortal } from "@/lib/portal/refresh";
import { getOrCreateVoter } from "@/lib/portal/voter";
import { rateLimit } from "@/lib/rate-limit";
import { isUuid } from "@/lib/uuid";

async function limitByIp(action: string, organizationId: string, max: number, seconds: number) {
  const ip = clientIp(await headers());
  return rateLimit(`${action}:${organizationId}:${ip}`, max, seconds);
}

// The workspace and a post in it. IDs come from the browser, so both are checked here.
async function findPost(organizationSlug: string, postId: unknown) {
  const { organization } = await getPortal(organizationSlug);
  if (!isUuid(postId)) {
    throw new Error("Invalid post.");
  }
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.organizationId, organization.id)))
    .limit(1);
  if (!post) {
    throw new Error("Post not found.");
  }
  return { organization, postId: post.id };
}

// Adds or removes the visitor's vote. The browser says which, so a double click can't flip
// it twice; repeating the same request changes nothing.
export async function setVote(formData: FormData) {
  const organizationSlug = String(formData.get("org"));
  const { organization, postId } = await findPost(organizationSlug, formData.get("postId"));

  if (!(await limitByIp("vote", organization.id, 60, 60)).allowed) {
    return;
  }
  const voter = await getOrCreateVoter(organization.id);
  const change =
    formData.get("intent") === "remove"
      ? db.delete(votes).where(and(eq(votes.postId, postId), eq(votes.voterId, voter.id)))
      : db.insert(votes).values({ postId, voterId: voter.id }).onConflictDoNothing();

  await db.batch([
    change,
    db.update(posts).set({ voteCount: recountVotes }).where(eq(posts.id, postId)),
  ]);
  refreshPortal(organizationSlug);
}

export type PostFormState = {
  error?: string;
  values?: Record<"boardId" | "title" | "body" | "name" | "email", string>;
};

export async function createPost(
  _previous: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const organizationSlug = String(formData.get("org"));
  const { organization, boards } = await getPortal(organizationSlug);
  const values = {
    boardId: String(formData.get("boardId") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };

  const board = boards.find((candidate) => candidate.id === values.boardId);
  if (!board) {
    return { error: "Please choose a board.", values };
  }
  const input = checkPostInput(values.title, values.body);
  if ("error" in input) {
    return { error: input.error, values };
  }
  const details = checkVoterDetails(values.name, values.email);
  if ("error" in details) {
    return { error: details.error, values };
  }
  if (!(await limitByIp("post", organization.id, 5, 600)).allowed) {
    return { error: "You've shared a lot of ideas just now. Please try again later.", values };
  }

  const [teamViewer, voter] = await Promise.all([
    getTeamViewer(organization.id),
    getOrCreateVoter(organization.id, details),
  ]);

  // The author votes for their own idea, in the same transaction.
  const postId = randomUUID();
  await db.batch([
    db.insert(posts).values({
      id: postId,
      organizationId: organization.id,
      boardId: board.id,
      title: input.title,
      body: input.body,
      voteCount: 1,
      authorUserId: teamViewer?.userId ?? null,
      authorVoterId: teamViewer ? null : voter.id,
    }),
    db.insert(votes).values({ postId, voterId: voter.id }),
  ]);
  refreshPortal(organizationSlug);
  redirect(`/p/${organizationSlug}/posts/${postId}`);
}

export type CommentFormState = { error?: string; body?: string; sent?: number };

export async function addComment(
  _previous: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const organizationSlug = String(formData.get("org"));
  const { organization, postId } = await findPost(organizationSlug, formData.get("postId"));
  const rawBody = String(formData.get("body") ?? "");

  const input = checkCommentInput(rawBody);
  if ("error" in input) {
    return { error: input.error, body: rawBody };
  }
  const details = checkVoterDetails(formData.get("name"), formData.get("email"));
  if ("error" in details) {
    return { error: details.error, body: rawBody };
  }
  if (!(await limitByIp("comment", organization.id, 10, 600)).allowed) {
    return { error: "Too many comments just now. Please try again later.", body: rawBody };
  }

  const teamViewer = await getTeamViewer(organization.id);
  const voter = teamViewer ? null : await getOrCreateVoter(organization.id, details);

  await db.batch([
    db.insert(comments).values({
      organizationId: organization.id,
      postId,
      body: input.body,
      authorUserId: teamViewer?.userId ?? null,
      authorVoterId: voter?.id ?? null,
    }),
    db.update(posts).set({ commentCount: recountComments }).where(eq(posts.id, postId)),
  ]);
  refreshPortal(organizationSlug);
  // A new number each time, so the form knows to clear itself.
  return { sent: Date.now() };
}
