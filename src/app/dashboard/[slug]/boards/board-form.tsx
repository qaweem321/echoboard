"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { BOARD_DESCRIPTION_MAX, BOARD_NAME_MAX } from "@/lib/board";
import { type BoardFormState, createBoard, updateBoard } from "./actions";

type Props = {
  slug: string;
  // Edit this board; without it the form creates a new one.
  board?: { id: string; name: string; description: string | null };
};

export function BoardForm({ slug, board }: Props) {
  const [state, formAction] = useActionState(
    board ? updateBoard : createBoard,
    {} as BoardFormState,
  );
  const idPrefix = board ? `board-${board.id}` : "new-board";

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      {board && <input type="hidden" name="boardId" value={board.id} />}
      <div className="flex flex-wrap gap-2">
        <Input
          id={`${idPrefix}-name`}
          name="name"
          required
          maxLength={BOARD_NAME_MAX}
          defaultValue={state.name ?? board?.name}
          placeholder="Board name, e.g. Feature requests"
          aria-label="Board name"
          className="sm:w-64"
        />
        <Input
          id={`${idPrefix}-description`}
          name="description"
          maxLength={BOARD_DESCRIPTION_MAX}
          defaultValue={state.description ?? board?.description ?? ""}
          placeholder="Description (optional)"
          aria-label="Board description"
          className="flex-1 min-w-56"
        />
        <SubmitButton pendingText={board ? "Saving..." : "Adding..."}>
          {board ? "Save" : "Add board"}
        </SubmitButton>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {board && state.saved && <p className="text-sm text-success">Saved.</p>}
    </form>
  );
}
