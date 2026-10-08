import { sql } from "drizzle-orm";
import { db } from "@/db";
import { voters } from "@/db/schema";
import { requireEnv } from "@/lib/env";
import { verifyUnsubscribe } from "@/lib/unsubscribe-token";
import { isUuid } from "@/lib/uuid";

// Stops update emails for this voter and every other voter row with the same email in the
// same workspace (people vote from several browsers). Returns false for a bad link.
export async function unsubscribeVoter(voterId: unknown, token: unknown) {
  if (
    !isUuid(voterId) ||
    typeof token !== "string" ||
    !verifyUnsubscribe(voterId, token, requireEnv("BETTER_AUTH_SECRET"))
  ) {
    return false;
  }
  await db.execute(sql`
    update ${voters} set unsubscribed_at = now()
    where unsubscribed_at is null and id in (
      select other.id from ${voters} as me
      join ${voters} as other on other.organization_id = me.organization_id
        and (other.id = me.id or other.email = me.email)
      where me.id = ${voterId}
    )`);
  return true;
}
