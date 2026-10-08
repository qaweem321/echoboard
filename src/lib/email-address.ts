// 254 characters is the longest valid email address.
const MAX_EMAIL_LENGTH = 254;

// "name@domain.tld": no spaces, one @, and dot-separated domain parts. The parts can't
// overlap, so checking even a very long fake address stays fast (no regex backtracking).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function isValidEmail(email: string) {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
}
