"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { type AddWebhookState, addWebhook } from "./actions";

export function AddWebhookForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(addWebhook, {} as AddWebhookState);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap gap-2">
        <div className="min-w-64 flex-1">
          <Input
            name="url"
            type="url"
            required
            defaultValue={state.url}
            placeholder="https://hooks.slack.com/services/..."
            aria-label="Webhook address"
          />
        </div>
        <SubmitButton pendingText="Adding...">Add webhook</SubmitButton>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
