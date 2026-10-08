"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { type UnsubscribeState, unsubscribe } from "./actions";

export function UnsubscribeForm({ voterId, token }: { voterId: string; token: string }) {
  const [state, formAction] = useActionState(unsubscribe, {} as UnsubscribeState);

  if (state.done) {
    return (
      <p className="text-success">Done. You won&apos;t get update emails from this board again.</p>
    );
  }
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="v" value={voterId} />
      <input type="hidden" name="t" value={token} />
      <SubmitButton pendingText="Unsubscribing...">Unsubscribe</SubmitButton>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
