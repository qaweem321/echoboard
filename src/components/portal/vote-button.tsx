"use client";

import { useOptimistic } from "react";
import { setVote } from "@/app/p/[org]/actions";
import { cn } from "@/lib/cn";

type Props = {
  organizationSlug: string;
  postId: string;
  voted: boolean;
  count: number;
  title: string;
};

// The upvote box. It flips straight away (optimistic) and the server confirms in the background,
// so voting feels instant even on a slow connection.
export function VoteButton({ organizationSlug, postId, voted, count, title }: Props) {
  const [state, setState] = useOptimistic({ voted, count });

  async function vote(formData: FormData) {
    setState({ voted: !state.voted, count: state.count + (state.voted ? -1 : 1) });
    await setVote(formData);
  }

  return (
    <form action={vote}>
      <input type="hidden" name="org" value={organizationSlug} />
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="intent" value={state.voted ? "remove" : "add"} />
      <button
        type="submit"
        aria-pressed={state.voted}
        aria-label={`${state.voted ? "Remove your vote for" : "Vote for"} ${title} (${state.count} votes)`}
        className={cn(
          "flex w-14 flex-col items-center rounded-lg border py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-blue-600",
          state.voted
            ? "border-link bg-link/10 text-link"
            : "border-border text-foreground hover:border-link",
        )}
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5l8 10H4z" />
        </svg>
        {state.count}
      </button>
    </form>
  );
}
