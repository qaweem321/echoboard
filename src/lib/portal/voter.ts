import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { voters } from "@/db/schema";
import { hashVoterToken, isVoterToken, newVoterToken, VOTER_COOKIE } from "@/lib/voter-token";

const ONE_YEAR = 60 * 60 * 24 * 365;

type VoterDetails = { name: string | null; email: string | null };

// The voter hash for a token, or null for a missing or malformed token.
export function voterHash(organizationId: string, token: unknown) {
  return isVoterToken(token) ? hashVoterToken(organizationId, token) : null;
}

// Finds the voter for this token in the workspace, creating it on first use. A name or email
// they type is saved; empty fields keep what was saved before. One database round trip.
export async function upsertVoter(organizationId: string, token: string, details?: VoterDetails) {
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

// --- The portal identifies visitors with a cookie (the widget sends a token instead) ---

// The current visitor's voter hash in this workspace, or null if they haven't done anything
// yet. Only reads the cookie; no database call.
export async function currentVoterHash(organizationId: string) {
  return voterHash(organizationId, (await cookies()).get(VOTER_COOKIE)?.value);
}

// For portal actions: the visitor's voter, creating it and the cookie on their first action.
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
  return upsertVoter(organizationId, token, details);
}
