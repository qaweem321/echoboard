"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { Role } from "@/lib/permissions";
import { type InviteState, inviteMember } from "./actions";

type Props = {
  slug: string;
  roles: readonly Role[];
};

export function InviteForm({ slug, roles }: Props) {
  const [state, formAction, isPending] = useActionState(inviteMember, {} as InviteState);

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap gap-2">
        <Input
          name="email"
          type="email"
          required
          defaultValue={state.email}
          placeholder="teammate@company.com"
          aria-label="Email address to invite"
          className="flex-1 min-w-56"
        />
        <Select name="role" defaultValue="member" aria-label="Role">
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
        <Button disabled={isPending}>{isPending ? "Sending..." : "Invite"}</Button>
      </div>

      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-success">{state.success}</p>}
      {state.link && (
        <Input
          readOnly
          value={state.link}
          aria-label="Invitation link"
          onFocus={(event) => event.currentTarget.select()}
          className="mt-2 w-full"
        />
      )}
    </form>
  );
}
