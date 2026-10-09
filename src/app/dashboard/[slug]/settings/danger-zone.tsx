"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { endSentence } from "@/lib/format";
import { deleteOrganization, leaveOrganization } from "./actions";

type Props = {
  slug: string;
  organizationName: string;
  canDelete: boolean;
};

export function DangerZone({ slug, organizationName, canDelete }: Props) {
  const [leaveState, leaveAction, leaving] = useActionState(leaveOrganization, {});
  const [deleteState, deleteAction, deleting] = useActionState(deleteOrganization, {});

  return (
    <section className="mt-10 rounded-xl border border-danger/40 p-6 space-y-8">
      <h2 className="text-lg font-semibold text-danger">Danger zone</h2>

      <form
        action={leaveAction}
        onSubmit={(event) => {
          if (
            !window.confirm(`Leave ${organizationName}? You'll need a new invitation to come back.`)
          ) {
            event.preventDefault();
          }
        }}
        className="space-y-3"
      >
        <input type="hidden" name="slug" value={slug} />
        <div>
          <p className="font-medium">Leave workspace</p>
          <p className="text-sm text-muted-foreground">
            You will lose access to {endSentence(organizationName)}
          </p>
        </div>
        <Button disabled={leaving} variant="danger-outline">
          {leaving ? "Leaving..." : "Leave workspace"}
        </Button>
        {leaveState.error && <p className="text-sm text-danger">{leaveState.error}</p>}
      </form>

      {canDelete && (
        <form action={deleteAction} className="space-y-3 border-t border-border pt-8">
          <input type="hidden" name="slug" value={slug} />
          <div>
            <p className="font-medium">Delete workspace</p>
            <p className="text-sm text-muted-foreground">
              Permanently deletes {organizationName} with all its boards, feedback, votes, comments
              and changelog, and removes everyone&apos;s access. This cannot be undone.
            </p>
          </div>
          <label htmlFor="confirmName" className="block text-sm">
            Type <strong>{organizationName}</strong> to confirm.
          </label>
          <Input id="confirmName" name="confirmName" autoComplete="off" required />
          <Button disabled={deleting} variant="danger">
            {deleting ? "Deleting..." : "Delete workspace"}
          </Button>
          {deleteState.error && <p className="text-sm text-danger">{deleteState.error}</p>}
        </form>
      )}
    </section>
  );
}
