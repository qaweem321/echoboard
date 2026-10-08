const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

// "Oct 11, 2026": clear in every country, unlike 10/11/2026 (October 11 or 10 November?).
// Uses UTC so the date is the same on your computer and on the production server.
export function formatDate(date: Date) {
  return dateFormat.format(date);
}

// Ends a sentence with a full stop, unless the text already ends with one (or ! or ?),
// so a name like "Acme Inc." doesn't become "Acme Inc..".
export function endSentence(text: string) {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}
