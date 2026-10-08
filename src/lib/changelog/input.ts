export const ENTRY_TITLE_MAX = 120;
export const ENTRY_BODY_MAX = 20000;

// Shared by "new entry" and "save entry". Returns the cleaned values or an error to show.
export function checkEntryInput(
  rawTitle: unknown,
  rawBody: unknown,
): { title: string; body: string } | { error: string } {
  const title = String(rawTitle ?? "").trim();
  const body = String(rawBody ?? "").trim();
  if (!title) {
    return { error: "Please give the entry a title." };
  }
  if (title.length > ENTRY_TITLE_MAX) {
    return { error: `Please keep the title to ${ENTRY_TITLE_MAX} characters or fewer.` };
  }
  if (body.length > ENTRY_BODY_MAX) {
    return { error: `Please keep the text to ${ENTRY_BODY_MAX} characters or fewer.` };
  }
  return { title, body };
}
