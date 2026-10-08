"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { hasRenewingSubscription } from "@/lib/billing";
import { checkOrganizationName } from "@/lib/organization-name";
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
  const { user, role, organization } = await requireMembership(slug);

  if (role === "owner") {
    const owners = await db.$count(
      memberships,
      and(eq(memberships.organizationId, organization.id), eq(memberships.role, "owner")),
    );
    if (owners <= 1) {
      return {
        error:
          "You're the only owner. Make another member an owner first, or delete the organization.",
      };
    }
  }

  await db
    .delete(memberships)
    .where(and(eq(memberships.organizationId, organization.id), eq(memberships.userId, user.id)));
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

  if (await hasRenewingSubscription(organization.id)) {
    return {
      error:
        "This organization has an active subscription. Cancel it under Billing > Manage subscription first, so you aren't charged again.",
    };
  }

  await db.delete(organizations).where(eq(organizations.id, organization.id));
  redirect("/dashboard");
}
