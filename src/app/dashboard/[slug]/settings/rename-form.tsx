"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ORGANIZATION_NAME_MAX } from "@/lib/organization-name";
import { type RenameState, renameOrganization } from "./actions";

type Props = { slug: string; name: string; canEdit: boolean };

export function RenameForm({ slug, name, canEdit }: Props) {
  const [state, formAction] = useActionState(renameOrganization, {} as RenameState);

  return (
    <form action={formAction} className="mt-8 space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor="name" className="block text-sm font-medium">
        Workspace name
      </label>
      <Input
        id="name"
        name="name"
        required
        maxLength={ORGANIZATION_NAME_MAX}
        defaultValue={name}
        disabled={!canEdit}
      />
      {canEdit ? (
        <SubmitButton pendingText="Saving...">Save</SubmitButton>
      ) : (
        <p className="text-sm text-subtle-foreground">
          Only owners and admins can change these settings.
        </p>
      )}
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.saved && <p className="text-sm text-success">Saved.</p>}
    </form>
  );
}
