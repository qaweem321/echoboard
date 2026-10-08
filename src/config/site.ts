// Rebrand the app here: these values are used in page titles, the landing page and emails.
export const siteConfig = {
  name: "Echoboard",
  tagline: "Feedback boards, roadmap and changelog",
  description:
    "Collect feedback, let customers vote, share your roadmap and tell everyone when it ships.",
  // Used on the Terms and Privacy pages.
  companyName: "Your Company Ltd",
  supportEmail: "support@example.com",
};

// Builds a full link like "https://yourapp.com/invite/abc". Server-only: it reads BETTER_AUTH_URL.
export function absoluteUrl(path: string) {
  return `${process.env.BETTER_AUTH_URL}${path}`;
}
