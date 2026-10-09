"use client";

import { useActionState, useState } from "react";
import { SimilarIdeas } from "@/components/portal/similar-ideas";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { POST_BODY_MAX, POST_TITLE_MAX, VOTER_NAME_MAX } from "@/lib/feedback-input";
import { createPost, type PostFormState } from "./actions";

type Props = {
  organizationSlug: string;
  boards: { id: string; name: string }[];
  defaultBoardId?: string;
  // Start of portal links: "/p/acme", or "" on the workspace's own domain.
  base: string;
};

// "Share an idea". No account needed; name and email are optional.
export function PostForm({ organizationSlug, boards, defaultBoardId, base }: Props) {
  const [state, formAction] = useActionState(createPost, {} as PostFormState);
  const values = state.values;
  // Watched to suggest similar ideas while typing.
  const [title, setTitle] = useState(values?.title ?? "");

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="org" value={organizationSlug} />
      {boards.length > 1 ? (
        <div>
          <label htmlFor="post-board" className="block text-sm font-medium mb-1">
            Board
          </label>
          <Select
            id="post-board"
            name="boardId"
            defaultValue={values?.boardId ?? defaultBoardId ?? boards[0].id}
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <input type="hidden" name="boardId" value={boards[0].id} />
      )}
      <Input
        name="title"
        required
        minLength={3}
        maxLength={POST_TITLE_MAX}
        defaultValue={values?.title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Short title, e.g. Export reports to CSV"
        aria-label="Title"
      />
      <SimilarIdeas organizationSlug={organizationSlug} title={title} base={base} />
      <Textarea
        name="body"
        maxLength={POST_BODY_MAX}
        defaultValue={values?.body}
        placeholder="Details: what are you trying to do, and why does it matter? (optional)"
        aria-label="Details"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          name="name"
          maxLength={VOTER_NAME_MAX}
          defaultValue={values?.name}
          placeholder="Your name (optional)"
          autoComplete="name"
        />
        <Input
          name="email"
          type="email"
          defaultValue={values?.email}
          placeholder="Email, to hear when it ships (optional)"
          autoComplete="email"
        />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton pendingText="Posting...">Post idea</SubmitButton>
    </form>
  );
}
