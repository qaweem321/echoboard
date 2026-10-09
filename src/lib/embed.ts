// Shared by the widget page (browser) and the widget's API route. No server-only imports.

// The widget sends the visitor's token in this header (cookies are often blocked inside
// other websites, so the widget keeps the token in its own storage instead).
export const EMBED_TOKEN_HEADER = "x-voter-token";

// Messages between the widget panel and the page it's embedded in (public/widget.js).
export const WIDGET_CLOSE_MESSAGE = "feedback-widget:close";

// A random voter token in the same format as the portal's cookie (32 bytes, base64url).
export function newBrowserVoterToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
