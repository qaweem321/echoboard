"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { type TestWebhookState, testWebhook } from "./actions";

export function TestWebhookButton({ slug, webhookId }: { slug: string; webhookId: string }) {
  const [state, formAction] = useActionState(testWebhook, {} as TestWebhookState);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="webhookId" value={webhookId} />
      <SubmitButton variant="link" size="inline" pendingText="Sending...">
        Send test
      </SubmitButton>
      {state.result && (
        <span className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>
          {state.result}
        </span>
      )}
    </form>
  );
}
