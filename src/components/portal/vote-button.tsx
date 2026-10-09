"use client";

import { useOptimistic } from "react";
import { setVote } from "@/app/p/[org]/actions";
import { VoteBox } from "./vote-box";

type Props = {
  organizationSlug: string;
  postId: string;
  voted: boolean;
  count: number;
  title: string;
};

// The portal's vote button. It flips straight away (optimistic) and the server confirms in the
// background, so voting feels instant even on a slow connection.
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
      <VoteBox type="submit" voted={state.voted} count={state.count} title={title} />
    </form>
  );
}
