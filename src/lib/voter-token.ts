import { createHash, randomBytes } from "node:crypto";

// Portal visitors are recognised by a random token in this cookie. It never leaves their
// browser in readable form: the database only stores a hash of it.
export const VOTER_COOKIE = "voter";

export function newVoterToken() {
  return randomBytes(32).toString("base64url");
}

// One browser cookie gives a different voter in every workspace, so workspaces can't link
// their visitors to each other's.
export function hashVoterToken(organizationId: string, token: string) {
  return createHash("sha256").update(`${organizationId}:${token}`).digest("hex");
}

// Rejects values we didn't create before hashing them.
export { isVoterToken } from "./voter-token-format";
