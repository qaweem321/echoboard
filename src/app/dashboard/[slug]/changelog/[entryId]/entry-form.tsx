"use client";

import { useActionState } from "react";
import { StatusBadge } from "@/components/portal/status-badge";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ENTRY_BODY_MAX, ENTRY_TITLE_MAX } from "@/lib/changelog/input";
import type { PostStatus } from "@/lib/post-status";
import { type EntryFormState, saveEntry } from "../actions";

type Props = {
  slug: string;
  entry: {
    id: string;
    title: string;
    body: string;
    publishedAt: Date | null;
    posts: { id: string; title: string }[];
  };
  linkablePosts: { id: string; title: string; status: PostStatus }[];
};

export function EntryForm({ slug, entry, linkablePosts }: Props) {
  const [state, formAction] = useActionState(saveEntry, {} as EntryFormState);
  const linked = new Set(entry.posts.map((post) => post.id));
  const published = Boolean(entry.publishedAt);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="entryId" value={entry.id} />
      <div>
        <label htmlFor="entry-title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <Input
          id="entry-title"
          name="title"
          required
          maxLength={ENTRY_TITLE_MAX}
          defaultValue={entry.title}
        />
      </div>
      <div>
        <label htmlFor="entry-body" className="mb-1 block text-sm font-medium">
          What changed
        </label>
        <Textarea
          id="entry-body"
          name="body"
          maxLength={ENTRY_BODY_MAX}
          defaultValue={entry.body}
          placeholder="Describe the update. Line breaks are kept."
          className="min-h-48"
        />
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Ideas this ships</legend>
        {linkablePosts.length === 0 ? (
          <p className="text-sm text-subtle-foreground">
            No planned, in-progress or complete ideas to link yet.
          </p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
            {linkablePosts.map((post) => (
              <li key={post.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="postIds"
                    value={post.id}
                    defaultChecked={linked.has(post.id)}
                  />
                  <span className="min-w-0 flex-1 truncate">{post.title}</span>
                  <StatusBadge status={post.status} />
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="shipLinked" defaultChecked className="mt-1" />
        <span>
          When publishing, mark the linked ideas Complete and email the people who voted for them
          (only ideas that weren&apos;t Complete yet, so nobody gets the same news twice).
        </span>
      </label>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.saved && <p className="text-sm text-success">{state.saved}</p>}

      <div className="flex flex-wrap gap-2">
        <SubmitButton
          name="intent"
          value="publish"
          pendingText="Saving..."
          confirm={
            published
              ? undefined
              : "Publish this entry on your public changelog? If the box is ticked, voters of the linked ideas get an email."
          }
        >
          {published ? "Save" : "Publish"}
        </SubmitButton>
        {!published && (
          <SubmitButton name="intent" value="save" variant="outline" pendingText="Saving...">
            Save draft
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
