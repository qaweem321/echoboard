// The shape of a voter token: 32 random bytes as base64url (43 characters).
// Browser-safe, so the widget can check tokens too.
export function isVoterToken(value: unknown): value is string {
  return typeof value === "string" && /^[\w-]{43}$/.test(value);
}
