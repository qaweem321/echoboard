"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { organizationsStillCharged } from "@/lib/billing";
import { checkOrganizationName } from "@/lib/organization-name";
import { removeMembershipKeepingOwner } from "@/lib/owners";
import { requireMembership, requirePermission } from "@/lib/session";

export type RenameState = { error?: string; saved?: boolean };

export async function renameOrganization(
  _previous: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "organization:update");

  const checked = checkOrganizationName(formData.get("name"));
  if ("error" in checked) {
    return { error: checked.error };
  }

  await db
    .update(organizations)
    .set({ name: checked.name })
    .where(eq(organizations.id, organization.id));
  revalidatePath(`/dashboard/${slug}`, "layout");
  return { saved: true };
}

export type DangerZoneState = { error?: string };

export async function leaveOrganization(
  _previous: DangerZoneState,
  formData: FormData,
): Promise<DangerZoneState> {
  const slug = String(formData.get("slug"));
  const { user, membershipId, organization } = await requireMembership(slug);

  // Refused (in the same step) when you're the last owner, also if another owner leaves or is
  // removed at the same moment.
  if (!(await removeMembershipKeepingOwner(organization.id, membershipId, user.id))) {
    return {
      error: "You're the only owner. Make another member an owner first, or delete the workspace.",
    };
  }
  redirect("/dashboard");
}

export async function deleteOrganization(
  _previous: DangerZoneState,
  formData: FormData,
): Promise<DangerZoneState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "organization:delete");

  if (String(formData.get("confirmName") ?? "").trim() !== organization.name) {
    return { error: `Type "${organization.name}" exactly to confirm.` };
  }

  if ((await organizationsStillCharged([organization.id])).has(organization.id)) {
    return {
      error:
        "This workspace still has a subscription that would charge the card. Cancel it under Billing > Manage subscription first.",
    };
  }

  await db.delete(organizations).where(eq(organizations.id, organization.id));
  redirect("/dashboard");
}
