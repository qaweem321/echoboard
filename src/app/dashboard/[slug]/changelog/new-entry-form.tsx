"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ENTRY_TITLE_MAX } from "@/lib/changelog/input";
import { createEntry, type NewEntryState } from "./actions";

// Starts a draft from a title; the rest is written on the entry's own page.
export function NewEntryForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(createEntry, {} as NewEntryState);
  return (
    <form action={formAction} className="mt-6 space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap gap-2">
        <div className="min-w-56 flex-1">
          <Input
            name="title"
            required
            maxLength={ENTRY_TITLE_MAX}
            defaultValue={state.title}
            placeholder="New entry title, e.g. October release"
            aria-label="New entry title"
          />
        </div>
        <SubmitButton pendingText="Creating...">New draft</SubmitButton>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
