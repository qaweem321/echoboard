import { and, count, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { hasRenewingSubscription } from "@/lib/billing";

type AccountDeletionPlan = {
  // Reasons the account can't be deleted yet. Empty means it can.
  blockers: string[];
  // Organizations where the user is the only member. They are deleted with the account.
  soloOrganizations: { id: string; name: string }[];
};

// Decides what happens to the user's organizations when they delete their account.
export async function planAccountDeletion(userId: string): Promise<AccountDeletionPlan> {
  // One query: every organization the user owns, with its member and owner counts.
  const everyone = alias(memberships, "everyone");
  const owned = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      members: count(everyone.id),
      owners: sql<number>`count(*) filter (where ${everyone.role} = 'owner')`.mapWith(Number),
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .innerJoin(everyone, eq(everyone.organizationId, organizations.id))
    .where(and(eq(memberships.userId, userId), eq(memberships.role, "owner")))
    .groupBy(organizations.id, organizations.name);

  const solo = owned.filter((organization) => organization.members === 1);
  const renewing = await Promise.all(
    solo.map((organization) => hasRenewingSubscription(organization.id)),
  );

  const plan: AccountDeletionPlan = { blockers: [], soloOrganizations: [] };
  solo.forEach((organization, index) => {
    if (renewing[index]) {
      plan.blockers.push(
        `${organization.name} has an active subscription. Cancel it under Billing > Manage subscription first.`,
      );
    } else {
      plan.soloOrganizations.push({ id: organization.id, name: organization.name });
    }
  });
  for (const organization of owned) {
    if (organization.members > 1 && organization.owners === 1) {
      plan.blockers.push(
        `You're the only owner of ${organization.name}. Make another member an owner first.`,
      );
    }
  }
  return plan;
}

export async function deleteOrganizations(ids: string[]) {
  if (ids.length > 0) {
    await db.delete(organizations).where(inArray(organizations.id, ids));
  }
}
