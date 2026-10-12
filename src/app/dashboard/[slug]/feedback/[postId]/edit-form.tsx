"use client";

import { useActionState } from "react";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { POST_BODY_MAX, POST_TITLE_MAX } from "@/lib/feedback-input";
import { type PostStatus, postStatuses, postStatusLabels } from "@/lib/post-status";
import { type PostEditState, updatePost } from "../actions";

type Props = {
  slug: string;
  // How many voters left an email and would get a status update.
  // null: this person may not email voters (members), so the option isn't shown.
  reachableVoters: number | null;
  post: { id: string; title: string; body: string | null; status: PostStatus; boardId: string };
  boards: { id: string; name: string }[];
};

// Status, board, title and details in one form, so a triage is one save.
export function EditPostForm({ slug, post, boards, reachableVoters }: Props) {
  const [state, formAction] = useActionState(updatePost, {} as PostEditState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="postId" value={post.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="post-status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <Select id="post-status" name="status" defaultValue={post.status} className="w-full">
            {postStatuses.map((status) => (
              <option key={status} value={status}>
                {postStatusLabels[status]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="post-board" className="mb-1 block text-sm font-medium">
            Board
          </label>
          <Select id="post-board" name="boardId" defaultValue={post.boardId} className="w-full">
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <label htmlFor="post-title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <Input
          id="post-title"
          name="title"
          required
          minLength={3}
          maxLength={POST_TITLE_MAX}
          defaultValue={post.title}
        />
      </div>
      <div>
        <label htmlFor="post-body" className="mb-1 block text-sm font-medium">
          Details
        </label>
        <Textarea
          id="post-body"
          name="body"
          maxLength={POST_BODY_MAX}
          defaultValue={post.body ?? ""}
          className="min-h-32"
        />
      </div>
      {reachableVoters !== null && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="notify" defaultChecked className="mt-1" />
          <span>
            Email voters when the status changes ({reachableVoters}{" "}
            {reachableVoters === 1 ? "person" : "people"} left an email). Sent for Under review,
            Planned, In progress and Complete.
          </span>
        </label>
      )}
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.saved && (
        <p className="text-sm text-success">Saved.{state.notice && ` ${state.notice}`}</p>
      )}
      <SubmitButton pendingText="Saving...">Save changes</SubmitButton>
    </form>
  );
}
