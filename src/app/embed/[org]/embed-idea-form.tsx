"use client";

import { useState } from "react";
import { SimilarIdeas } from "@/components/portal/similar-ideas";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { POST_BODY_MAX, POST_TITLE_MAX, VOTER_NAME_MAX } from "@/lib/feedback-input";
import { type EmbedIdea, embedPostIdea } from "./actions";

type Props = {
  organizationSlug: string;
  token: string;
  boards: { id: string; name: string }[];
  onPosted: () => void;
};

export function EmbedIdeaForm({ organizationSlug, token, boards, onPosted }: Props) {
  const [error, setError] = useState<string | null>(null);
  // What was typed, so a mistake doesn't clear the form.
  const [values, setValues] = useState<EmbedIdea | null>(null);
  const [title, setTitle] = useState("");

  async function submit(formData: FormData) {
    const idea: EmbedIdea = {
      boardId: String(formData.get("boardId") ?? ""),
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
    };
    const result = await embedPostIdea(organizationSlug, token, idea).catch(() => ({
      error: "Something went wrong. Please try again.",
    }));
    if ("error" in result) {
      setValues(idea);
      setError(result.error);
      return;
    }
    onPosted();
  }

  return (
    <form action={submit} className="space-y-3">
      {boards.length > 1 ? (
        <Select
          name="boardId"
          defaultValue={values?.boardId ?? boards[0].id}
          aria-label="Board"
          className="w-full"
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </Select>
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
      <SimilarIdeas
        organizationSlug={organizationSlug}
        title={title}
        base={`/p/${organizationSlug}`}
        newTab
      />
      <Textarea
        name="body"
        maxLength={POST_BODY_MAX}
        defaultValue={values?.body}
        placeholder="Details (optional)"
        aria-label="Details"
      />
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
      {error && <p className="text-sm text-danger">{error}</p>}
      <SubmitButton size="full" pendingText="Posting...">
        Post idea
      </SubmitButton>
    </form>
  );
}
