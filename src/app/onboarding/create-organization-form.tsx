"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ORGANIZATION_NAME_MAX } from "@/lib/organization-name";
import { type CreateOrganizationState, createOrganization } from "./actions";

export function CreateOrganizationForm() {
  const [state, formAction] = useActionState(createOrganization, {} as CreateOrganizationState);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="name"
        required
        maxLength={ORGANIZATION_NAME_MAX}
        placeholder="Company or team name"
        autoComplete="organization"
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton size="full" pendingText="Creating...">
        Create workspace
      </SubmitButton>
    </form>
  );
}
