import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { Role } from "@/lib/permissions";

// Removing or demoting an owner must never leave a workspace without one. Checking the
// owner count first and changing it in a second step isn't enough: two owners removing each
// other at the same moment would both see two owners. So each change is one statement that
// first locks the organization's owner rows (the second request waits for the first, then sees
// what it changed) and only goes ahead if another owner remains and `actorId` is still an owner.

const lockedOwners = (organizationId: string) => sql`
  with owners as (
    select id, user_id from memberships
    where organization_id = ${organizationId} and role = 'owner'
    for update
  )`;

// Removes a member (or the person themselves, when leaving). False when that would leave no
// owner, or `actorId` is no longer allowed to remove an owner.
export async function removeMembershipKeepingOwner(
  organizationId: string,
  membershipId: string,
  actorId: string,
) {
  const result = await db.execute(sql`${lockedOwners(organizationId)}
    delete from memberships m
    where m.id = ${membershipId} and m.organization_id = ${organizationId}
      and (m.role <> 'owner' or (
        exists (select 1 from owners where id <> m.id)
        and exists (select 1 from owners where user_id = ${actorId})
      ))
    returning m.id`);
  return result.rows.length > 0;
}

// Changes a member's role (only owners do this). False when it would demote the last owner, or
// `actorId` is no longer an owner.
export async function changeRoleKeepingOwner(
  organizationId: string,
  membershipId: string,
  role: Role,
  actorId: string,
) {
  const result = await db.execute(sql`${lockedOwners(organizationId)}
    update memberships m set role = ${role}::role
    where m.id = ${membershipId} and m.organization_id = ${organizationId}
      and exists (select 1 from owners where user_id = ${actorId})
      and (m.role <> 'owner' or ${role}::text = 'owner' or exists (select 1 from owners where id <> m.id))
    returning m.id`);
  return result.rows.length > 0;
}
