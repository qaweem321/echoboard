import { BlockList, isIP } from "node:net";

const URL_MAX = 500;

// Private, loopback, link-local, shared, multicast and reserved ranges. A webhook must never make
// the server call its own network (for example a cloud metadata service at 169.254.169.254).
// BlockList also matches IPv4 addresses wrapped in IPv6 (::ffff:7f00:1 is 127.0.0.1), which is
// how `new URL()` rewrites a host like [::ffff:127.0.0.1].
const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 3],
] as const) {
  blocked.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 96], // unspecified, loopback and the old IPv4-compatible form (::7f00:1)
  ["64:ff9b::", 96], // NAT64: an IPv4 address reached through a translator
  ["2002::", 16], // 6to4: an IPv4 address inside an IPv6 one
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const) {
  blocked.addSubnet(network, prefix, "ipv6");
}

export function isPrivateAddress(address: string) {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "");
  const version = isIP(ip);
  if (version === 0) {
    return false;
  }
  return blocked.check(ip, version === 4 ? "ipv4" : "ipv6");
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
