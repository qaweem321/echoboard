import { isIP } from "node:net";

const URL_MAX = 500;

// Private, loopback and link-local addresses: a webhook must never make the server call its
// own network (for example a cloud metadata service at 169.254.169.254).
export function isPrivateAddress(address: string) {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (isIP(ip) === 6) {
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) {
      return isPrivateAddress(mapped[1]);
    }
    return (
      ip === "::" ||
      ip === "::1" ||
      ip.startsWith("fc") ||
      ip.startsWith("fd") ||
      ip.startsWith("fe8") ||
      ip.startsWith("fe9") ||
      ip.startsWith("fea") ||
      ip.startsWith("feb")
    );
  }
  return false;
}

// Webhook URLs must be https and public. `allowLocal` lets developers test with
// http://localhost while building (never in production).
export function checkWebhookUrl(
  raw: unknown,
  allowLocal: boolean,
): { url: string } | { error: string } {
  const value = String(raw ?? "").trim();
  if (!value || value.length > URL_MAX) {
    return { error: "Please enter the full address of your endpoint, starting with https://." };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: "Please enter the full address of your endpoint, starting with https://." };
  }
  const host = url.hostname.toLowerCase();
  const local = host === "localhost" || host.endsWith(".localhost") || isPrivateAddress(host);
  if (allowLocal && local) {
    return { url: url.toString() };
  }
  if (url.protocol !== "https:") {
    return { error: "The address must start with https://." };
  }
  if (local) {
    return { error: "Webhooks can't be sent to local or private network addresses." };
  }
  if (url.username || url.password) {
    return { error: "Please remove the user name and password from the address." };
  }
  return { url: url.toString() };
}
