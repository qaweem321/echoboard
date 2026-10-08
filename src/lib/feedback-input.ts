import { isValidEmail } from "./email-address";

export const POST_TITLE_MIN = 3;
export const POST_TITLE_MAX = 120;
export const POST_BODY_MAX = 5000;
export const COMMENT_MAX = 2000;
export const VOTER_NAME_MAX = 60;

type Result<T> = T | { error: string };

// Name and email are optional for portal visitors. The email lets us tell them when their
// idea ships, so it is checked and stored in lowercase.
export function checkVoterDetails(
  rawName: unknown,
  rawEmail: unknown,
): Result<{ name: string | null; email: string | null }> {
  const name = String(rawName ?? "").trim();
  const email = String(rawEmail ?? "")
    .trim()
    .toLowerCase();
  if (name.length > VOTER_NAME_MAX) {
    return { error: `Please use ${VOTER_NAME_MAX} characters or fewer for your name.` };
  }
  if (email && !isValidEmail(email)) {
    return { error: "Please enter a valid email address, or leave it empty." };
  }
  return { name: name || null, email: email || null };
}

export function checkPostInput(
  rawTitle: unknown,
  rawBody: unknown,
): Result<{ title: string; body: string | null }> {
  // Collapse runs of spaces in the title so "Dark    mode" and "Dark mode" look the same.
  const title = String(rawTitle ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const body = String(rawBody ?? "").trim();
  if (title.length < POST_TITLE_MIN) {
    return { error: `Please give your idea a title of at least ${POST_TITLE_MIN} characters.` };
  }
  if (title.length > POST_TITLE_MAX) {
    return { error: `Please keep the title to ${POST_TITLE_MAX} characters or fewer.` };
  }
  if (body.length > POST_BODY_MAX) {
    return { error: `Please keep the details to ${POST_BODY_MAX} characters or fewer.` };
  }
  return { title, body: body || null };
}

export function checkCommentInput(rawBody: unknown): Result<{ body: string }> {
  const body = String(rawBody ?? "").trim();
  if (!body) {
    return { error: "Please write a comment first." };
  }
  if (body.length > COMMENT_MAX) {
    return { error: `Please keep comments to ${COMMENT_MAX} characters or fewer.` };
  }
  return { body };
}

// Makes typed search text safe inside ILIKE: % and _ are wildcards there, \ is the escape.
export function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
