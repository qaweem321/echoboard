"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { type MergeState, mergePost } from "../actions";

type Props = {
  slug: string;
  postId: string;
  targets: { id: string; title: string; voteCount: number }[];
};

export function MergeForm({ slug, postId, targets }: Props) {
  const [state, formAction] = useActionState(mergePost, {} as MergeState);

  if (targets.length === 0) {
    return (
      <p className="text-sm text-subtle-foreground">There are no other posts to merge into.</p>
    );
  }
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="postId" value={postId} />
      <Select
        name="targetId"
        required
        defaultValue=""
        aria-label="Post to merge into"
        className="w-full"
      >
        <option value="" disabled>
          Choose the main post...
        </option>
        {targets.map((target) => (
          <option key={target.id} value={target.id}>
            {target.title} ({target.voteCount} {target.voteCount === 1 ? "vote" : "votes"})
          </option>
        ))}
      </Select>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton
        variant="outline"
        pendingText="Merging..."
        confirm="Merge this post? Its votes and comments move to the main post, and its link will open the main post."
      >
        Merge
      </SubmitButton>
    </form>
  );
}
