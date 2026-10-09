"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { atomic } from "@/db/atomic";
import { boards, comments, posts } from "@/db/schema";
import { recountComments } from "@/lib/feedback/counts";
import { mergePosts } from "@/lib/feedback/merge";
import { checkPostInput } from "@/lib/feedback-input";
import { emailVoters, notifiableStatuses } from "@/lib/notifications/voter-updates";
import type { Permission } from "@/lib/permissions";
import { refreshPortal } from "@/lib/portal/refresh";
import { isPostStatus } from "@/lib/post-status";
import { requirePermission } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { emitWebhookEvent } from "@/lib/webhooks/dispatch";
import { postRef } from "@/lib/webhooks/refs";

function refresh(slug: string, postId?: string) {
  revalidatePath(`/dashboard/${slug}/feedback`);
  refreshPortal(slug);
  if (postId) {
    revalidatePath(`/dashboard/${slug}/feedback/${postId}`);
  }
}

// Checks the permission and that the post (ID from the browser) belongs to this workspace.
async function requirePost(formData: FormData, permission: Permission) {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, permission);
  const postId = formData.get("postId");
  if (!isUuid(postId)) {
    throw new Error("Invalid post.");
  }
  const [post] = await db
    .select({ id: posts.id, status: posts.status, mergedIntoId: posts.mergedIntoId })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.organizationId, organization.id)))
    .limit(1);
  if (!post) {
    throw new Error("Post not found.");
  }
  return { slug, organization, post };
}

export type PostEditState = { error?: string; saved?: boolean; notice?: string };

function emailNotice(result: { sent: number } | { error: string }) {
  if ("error" in result) {
    return result.error;
  }
  return result.sent === 0
    ? "No voters left an email, so nobody was notified."
    : `Emailing ${result.sent} ${result.sent === 1 ? "voter" : "voters"}.`;
}

export async function updatePost(
  _previous: PostEditState,
  formData: FormData,
): Promise<PostEditState> {
  const { slug, organization, post } = await requirePost(formData, "feedback:manage");

  const input = checkPostInput(formData.get("title"), formData.get("body"));
  if ("error" in input) {
    return { error: input.error };
  }
  const status = formData.get("status");
  if (!isPostStatus(status)) {
    return { error: "Please choose a status." };
  }
  const boardId = String(formData.get("boardId"));
  const boardCount = isUuid(boardId)
    ? await db.$count(
        boards,
        and(eq(boards.id, boardId), eq(boards.organizationId, organization.id)),
      )
    : 0;
  if (boardCount === 0) {
    return { error: "Please choose a board." };
  }

  await db
    .update(posts)
    .set({ title: input.title, body: input.body, status, boardId, updatedAt: new Date() })
    .where(eq(posts.id, post.id));
  refresh(slug, post.id);
  if (status !== post.status) {
    emitWebhookEvent(organization, {
      type: "post.status_changed",
      post: postRef(organization, { id: post.id, title: input.title, status }),
      previousStatus: post.status,
    });
  }

  // Only a real status change is news, and only when the team ticked "Email voters".
  const notify =
    formData.get("notify") === "on" &&
    status !== post.status &&
    notifiableStatuses.includes(status);
  if (!notify) {
    return { saved: true };
  }
  const result = await emailVoters({ organization, postIds: [post.id], status });
  return { saved: true, notice: emailNotice(result) };
}

export type MergeState = { error?: string };

export async function mergePost(_previous: MergeState, formData: FormData): Promise<MergeState> {
  const { slug, organization, post } = await requirePost(formData, "feedback:manage");
  if (post.mergedIntoId) {
    return { error: "This post is already merged." };
  }

  const targetId = formData.get("targetId");
  const [target] = isUuid(targetId)
    ? await db
        .select({ id: posts.id })
        .from(posts)
        .where(
          and(
            eq(posts.id, targetId),
            eq(posts.organizationId, organization.id),
            isNull(posts.mergedIntoId),
          ),
        )
        .limit(1)
    : [];
  if (!target || target.id === post.id) {
    return { error: "Please choose the post to merge into." };
  }

  await mergePosts(post.id, target.id);
  refresh(slug, target.id);
  redirect(`/dashboard/${slug}/feedback/${target.id}`);
}

export async function deletePost(formData: FormData) {
  const { slug, post } = await requirePost(formData, "feedback:delete");
  // Votes and comments go with it (database cascade); merged duplicates are unlinked.
  await db.delete(posts).where(eq(posts.id, post.id));
  refresh(slug);
  redirect(`/dashboard/${slug}/feedback`);
}

export async function deleteComment(formData: FormData) {
  const { slug, organization, post } = await requirePost(formData, "feedback:delete");
  const commentId = formData.get("commentId");
  if (!isUuid(commentId)) {
    throw new Error("Invalid comment.");
  }
  await atomic((tx) => [
    tx
      .delete(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.postId, post.id),
          eq(comments.organizationId, organization.id),
        ),
      ),
    tx.update(posts).set({ commentCount: recountComments }).where(eq(posts.id, post.id)),
  ]);
  refresh(slug, post.id);
}
