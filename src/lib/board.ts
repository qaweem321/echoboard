export const BOARD_NAME_MAX = 50;
export const BOARD_DESCRIPTION_MAX = 300;

export type BoardInput = { name: string; description: string };

// Shared by "create board" and "edit board". Returns the cleaned values, or an error message
// to show next to the form.
export function checkBoardInput(
  rawName: unknown,
  rawDescription: unknown,
): BoardInput | { error: string } {
  const name = String(rawName ?? "").trim();
  const description = String(rawDescription ?? "").trim();
  if (!name) {
    return { error: "Please enter a board name." };
  }
  if (name.length > BOARD_NAME_MAX) {
    return { error: `Please use ${BOARD_NAME_MAX} characters or fewer for the name.` };
  }
  if (description.length > BOARD_DESCRIPTION_MAX) {
    return {
      error: `Please use ${BOARD_DESCRIPTION_MAX} characters or fewer for the description.`,
    };
  }
  return { name, description };
}

// Picks a URL slug that isn't used yet: "bugs", then "bugs-2", "bugs-3", ...
export function uniqueSlug(base: string, taken: readonly string[]) {
  const used = new Set(taken);
  if (!used.has(base)) {
    return base;
  }
  let n = 2;
  while (used.has(`${base}-${n}`)) {
    n++;
  }
  return `${base}-${n}`;
}
