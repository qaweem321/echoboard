"use server";

import {
  castVote,
  findWorkspacePost,
  submitIdea,
  withinVisitorLimit,
} from "@/lib/feedback/visitor";
import { checkPostInput, checkVoterDetails } from "@/lib/feedback-input";
import { findPortal } from "@/lib/portal/queries";
import { refreshPortal } from "@/lib/portal/refresh";
import { upsertVoter } from "@/lib/portal/voter";
import { isVoterToken } from "@/lib/voter-token";

// The widget's actions. Same rules as the portal, but the visitor is identified by the token
// the widget keeps in its own storage instead of a cookie.

async function requirePortal(organizationSlug: string, token: unknown) {
  const portal = await findPortal(organizationSlug);
  if (!portal || !isVoterToken(token)) {
    throw new Error("Invalid widget request.");
  }
  return { ...portal, token };
}

export async function embedVote(
  organizationSlug: string,
  token: string,
  rawPostId: string,
  intent: "add" | "remove",
): Promise<{ ok: boolean }> {
  const { organization } = await requirePortal(organizationSlug, token);
  const postId = await findWorkspacePost(organization.id, rawPostId);
  if (!postId || !(await withinVisitorLimit("vote", organization.id))) {
    return { ok: false };
  }
  const voter = await upsertVoter(organization.id, token);
  await castVote(postId, voter.id, intent === "remove" ? "remove" : "add");
  refreshPortal(organizationSlug);
  return { ok: true };
}

export type EmbedIdea = {
  boardId: string;
  title: string;
  body: string;
  name: string;
  email: string;
};

export async function embedPostIdea(
  organizationSlug: string,
  token: string,
  idea: EmbedIdea,
): Promise<{ error: string } | { postId: string }> {
  const { organization, boards } = await requirePortal(organizationSlug, token);
  const board = boards.find((candidate) => candidate.id === idea.boardId);
  if (!board) {
    return { error: "Please choose a board." };
  }
  const input = checkPostInput(idea.title, idea.body);
  if ("error" in input) {
    return input;
  }
  const details = checkVoterDetails(idea.name, idea.email);
  if ("error" in details) {
    return details;
  }
  if (!(await withinVisitorLimit("post", organization.id))) {
    return { error: "You've shared a lot of ideas just now. Please try again later." };
  }
  const voter = await upsertVoter(organization.id, token, details);
  const postId = await submitIdea({
    organizationId: organization.id,
    boardId: board.id,
    ...input,
    voterId: voter.id,
    authorUserId: null,
  });
  refreshPortal(organizationSlug);
  return { postId };
}
