"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { atomic } from "@/db/atomic";
import { invitations, memberships } from "@/db/schema";
import { findValidInvitation } from "@/lib/invitations";
import { requireUser } from "@/lib/session";

export type AcceptState = { error?: string };

export async function acceptInvitation(
  _previous: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const user = await requireUser();
  const found = await findValidInvitation(String(formData.get("token")));

  if (!found || found.invitation.email !== user.email.toLowerCase()) {
    return {
      error:
        "This invitation is no longer valid. It may have expired or been revoked. Ask for a new one.",
    };
  }

  await atomic((tx) => [
    tx
      .insert(memberships)
      .values({
        organizationId: found.organization.id,
        userId: user.id,
        role: found.invitation.role,
      })
      .onConflictDoNothing(),
    tx.delete(invitations).where(eq(invitations.id, found.invitation.id)),
  ]);

  redirect(`/dashboard/${found.organization.slug}`);
}
