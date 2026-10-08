import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { voters } from "@/db/schema";
import { hashVoterToken, isVoterToken, newVoterToken, VOTER_COOKIE } from "@/lib/voter-token";

const ONE_YEAR = 60 * 60 * 24 * 365;

// The current visitor's voter hash in this workspace, or null if they haven't done anything
// yet. Only reads the cookie; no database call.
export async function currentVoterHash(organizationId: string) {
  const token = (await cookies()).get(VOTER_COOKIE)?.value;
  return isVoterToken(token) ? hashVoterToken(organizationId, token) : null;
}

type VoterDetails = { name: string | null; email: string | null };

// For server actions (vote, post, comment): finds the visitor's voter row, creating it and the
// cookie on their first action. A name or email they type is saved; empty fields keep what
// was saved before. One database round trip.
export async function getOrCreateVoter(organizationId: string, details?: VoterDetails) {
  const cookieStore = await cookies();
  let token = cookieStore.get(VOTER_COOKIE)?.value;
  if (!isVoterToken(token)) {
    token = newVoterToken();
    cookieStore.set(VOTER_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR,
      path: "/",
    });
  }

  const [voter] = await db
    .insert(voters)
    .values({
      organizationId,
      tokenHash: hashVoterToken(organizationId, token),
      name: details?.name ?? null,
      email: details?.email ?? null,
    })
    .onConflictDoUpdate({
      target: voters.tokenHash,
      set: {
        name: sql`coalesce(excluded.name, ${voters.name})`,
        email: sql`coalesce(excluded.email, ${voters.email})`,
      },
    })
    .returning({ id: voters.id, name: voters.name, email: voters.email });
  return voter;
}
