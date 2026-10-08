"use client";

import { useActionState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { COMMENT_MAX, VOTER_NAME_MAX } from "@/lib/feedback-input";
import { addComment, type CommentFormState } from "./actions";

type Props = { organizationSlug: string; postId: string; isTeam: boolean };

export function CommentForm({ organizationSlug, postId, isTeam }: Props) {
  const [state, formAction] = useActionState(addComment, {} as CommentFormState);

  return (
    // A new key after each comment remounts the form, which clears the text box.
    <form key={state.sent} action={formAction} className="space-y-3">
      <input type="hidden" name="org" value={organizationSlug} />
      <input type="hidden" name="postId" value={postId} />
      <Textarea
        name="body"
        required
        maxLength={COMMENT_MAX}
        defaultValue={state.body}
        placeholder="Add a comment"
      />
      {/* Team members comment under their account name. */}
      {!isTeam && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            name="name"
            maxLength={VOTER_NAME_MAX}
            placeholder="Your name (optional)"
            autoComplete="name"
          />
          <Input
            name="email"
            type="email"
            placeholder="Email, to hear about updates (optional)"
            autoComplete="email"
          />
        </div>
      )}
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton pendingText="Sending...">Comment</SubmitButton>
    </form>
  );
}
