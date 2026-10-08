import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invitations, organizations } from "@/db/schema";

export async function findValidInvitation(token: string) {
  const [found] = await db
    .select({ invitation: invitations, organization: organizations })
    .from(invitations)
    .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
    .where(eq(invitations.token, token));

  if (!found || found.invitation.expiresAt < new Date()) {
    return null;
  }
  return found;
}
