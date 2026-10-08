import { createHmac, timingSafeEqual } from "node:crypto";

// Unsubscribe links carry the voter ID and a signature, so nobody can unsubscribe someone else
// by guessing IDs. The signature uses the app's secret; no database table is needed.

function signature(voterId: string, secret: string) {
  return createHmac("sha256", secret).update(`unsubscribe:${voterId}`).digest("base64url");
}

export function signUnsubscribe(voterId: string, secret: string) {
  return signature(voterId, secret);
}

export function verifyUnsubscribe(voterId: string, token: string, secret: string) {
  const expected = Buffer.from(signature(voterId, secret));
  const given = Buffer.from(token);
  // timingSafeEqual needs equal lengths; comparing in constant time hides how much matched.
  return expected.length === given.length && timingSafeEqual(expected, given);
}
