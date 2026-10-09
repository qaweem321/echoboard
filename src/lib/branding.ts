// Checks for the white-label settings (pure functions, shared by forms and tests).

type Result<T> = T | { error: string };

// "#2563EB", "#25e", " 2563eb " -> "#2563eb". Empty means "use the default color".
export function normalizeHexColor(raw: unknown): Result<{ color: string | null }> {
  let value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!value) {
    return { color: null };
  }
  if (!value.startsWith("#")) {
    value = `#${value}`;
  }
  if (/^#[0-9a-f]{3}$/.test(value)) {
    value = `#${[...value.slice(1)].map((digit) => digit + digit).join("")}`;
  }
  if (!/^#[0-9a-f]{6}$/.test(value)) {
    return { error: "Please enter a color like #2563eb." };
  }
  return { color: value };
}

// Relative luminance (WCAG) of a "#rrggbb" color, from 0 (black) to 1 (white).
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const WHITE = "#ffffff";
const DARK = "#111827";

// White or dark text, whichever is easier to read on the given background color.
export function readableTextColor(background: string) {
  const light = luminance(background);
  const contrastWithWhite = 1.05 / (light + 0.05);
  const contrastWithDark = (light + 0.05) / (luminance(DARK) + 0.05);
  return contrastWithWhite >= contrastWithDark ? WHITE : DARK;
}

const LOGO_URL_MAX = 500;

// Logos are linked, not uploaded: an https:// address of an image. Empty removes the logo.
export function checkLogoUrl(raw: unknown): Result<{ url: string | null }> {
  const value = String(raw ?? "").trim();
  if (!value) {
    return { url: null };
  }
  if (value.length > LOGO_URL_MAX) {
    return { error: `Please use a link of ${LOGO_URL_MAX} characters or fewer.` };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: "Please enter a full link to the image, starting with https://." };
  }
  if (url.protocol !== "https:") {
    return { error: "The logo link must start with https://." };
  }
  return { url: url.toString() };
}

const DOMAIN_MAX = 253;
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// "https://Feedback.Acme.com/" -> "feedback.acme.com". Empty removes the custom domain.
// The app's own domain can't be used, and IP addresses aren't domains.
export function normalizeDomain(raw: unknown, appHost: string): Result<{ domain: string | null }> {
  const domain = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/\.$/, "");
  if (!domain) {
    return { domain: null };
  }
  const labels = domain.split(".");
  const valid =
    domain.length <= DOMAIN_MAX &&
    labels.length >= 2 &&
    labels.every((label) => LABEL.test(label)) &&
    /^[a-z]{2,}$/.test(labels[labels.length - 1]);
  if (!valid) {
    return { error: "Please enter a domain like feedback.yourcompany.com." };
  }
  if (domain === appHost.toLowerCase()) {
    return {
      error: "That's this app's own domain. Use one of your own, like feedback.yourcompany.com.",
    };
  }
  return { domain };
}
