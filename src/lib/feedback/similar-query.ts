// Turns typed text into a Postgres search that matches any of its words, also as the start of
// a longer word: "export csv" -> "export:* | csv:*". Only letters and digits get through, so
// the result is always a valid, safe query. Returns null when there's nothing to search for.

const MIN_WORD = 3;
const MAX_WORDS = 6;

export function similarSearchQuery(text: string) {
  const words = [
    ...new Set(
      text
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= MIN_WORD),
    ),
  ].slice(0, MAX_WORDS);
  return words.length > 0 ? words.map((word) => `${word}:*`).join(" | ") : null;
}
