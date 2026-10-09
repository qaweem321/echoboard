"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { atomic } from "@/db/atomic";
import { comments, posts } from "@/db/schema";
import { recountComments } from "@/lib/feedback/counts";
import {
  castVote,
  findWorkspacePost,
  submitIdea,
  withinVisitorLimit,
} from "@/lib/feedback/visitor";
import { checkCommentInput, checkPostInput, checkVoterDetails } from "@/lib/feedback-input";
import { portalBase } from "@/lib/portal/links";
import { getPortal, getTeamViewer } from "@/lib/portal/queries";
import { refreshPortal } from "@/lib/portal/refresh";
import { getOrCreateVoter } from "@/lib/portal/voter";
import { emitWebhookEvent } from "@/lib/webhooks/dispatch";
import { postRef } from "@/lib/webhooks/refs";

// The workspace and a post in it. Both come from the browser, so both are checked.
async function requirePost(organizationSlug: string, rawPostId: unknown) {
  const { organization } = await getPortal(organizationSlug);
  const post = await findWorkspacePost(organization.id, rawPostId);
  if (!post) {
    throw new Error("Post not found.");
  }
  return { organization, post, postId: post.id };
}

export async function setVote(formData: FormData) {
  const organizationSlug = String(formData.get("org"));
  const { organization, postId } = await requirePost(organizationSlug, formData.get("postId"));
  if (!(await withinVisitorLimit("vote", organization.id))) {
    return;
  }
  const voter = await getOrCreateVoter(organization.id);
  await castVote(postId, voter.id, formData.get("intent") === "remove" ? "remove" : "add");
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
  if (!(await withinVisitorLimit("post", organization.id))) {
    return { error: "You've shared a lot of ideas just now. Please try again later.", values };
  }

  const [teamViewer, voter] = await Promise.all([
    getTeamViewer(organization.id),
    getOrCreateVoter(organization.id, details),
  ]);
  const postId = await submitIdea({
    organizationId: organization.id,
    boardId: board.id,
    ...input,
    voterId: voter.id,
    authorUserId: teamViewer?.userId ?? null,
  });
  refreshPortal(organizationSlug);
  emitWebhookEvent(organization, {
    type: "post.created",
    post: postRef(organization, { id: postId, title: input.title, status: "open" }),
  });
  redirect(`${await portalBase(organizationSlug)}/posts/${postId}`);
}

export type CommentFormState = { error?: string; body?: string; sent?: number };

export async function addComment(
  _previous: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const organizationSlug = String(formData.get("org"));
  const { organization, post, postId } = await requirePost(
    organizationSlug,
    formData.get("postId"),
  );
  const rawBody = String(formData.get("body") ?? "");

  const input = checkCommentInput(rawBody);
  if ("error" in input) {
    return { error: input.error, body: rawBody };
  }
  const details = checkVoterDetails(formData.get("name"), formData.get("email"));
  if ("error" in details) {
    return { error: details.error, body: rawBody };
  }
  if (!(await withinVisitorLimit("comment", organization.id))) {
    return { error: "Too many comments just now. Please try again later.", body: rawBody };
  }

  const teamViewer = await getTeamViewer(organization.id);
  const voter = teamViewer ? null : await getOrCreateVoter(organization.id, details);
  const commentId = randomUUID();

  await atomic((tx) => [
    tx.insert(comments).values({
      id: commentId,
      organizationId: organization.id,
      postId,
      body: input.body,
      authorUserId: teamViewer?.userId ?? null,
      authorVoterId: voter?.id ?? null,
    }),
    tx.update(posts).set({ commentCount: recountComments }).where(eq(posts.id, postId)),
  ]);
  refreshPortal(organizationSlug);
  emitWebhookEvent(organization, {
    type: "comment.created",
    post: postRef(organization, post),
    comment: {
      id: commentId,
      body: input.body,
      authorName: teamViewer?.name ?? voter?.name ?? details.name,
    },
  });
  // A new number each time, so the form knows to clear itself.
  return { sent: Date.now() };
}
