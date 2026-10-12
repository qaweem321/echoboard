import { type LookupAddress, lookup } from "node:dns";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import { isIP } from "node:net";
import { isPrivateAddress } from "./url";

export const PRIVATE_NETWORK_ERROR = "The address points to a private network.";

// Looks up the name for the connection itself and refuses private addresses in that same step.
// Checking first and letting the request look it up again would let a domain answer with a
// public address for the check and a private one (like 169.254.169.254) for the request.
function publicOnlyLookup(allowLocal: boolean): LookupFunction {
  return (hostname, options, callback) => {
    lookup(hostname, { ...options, all: true }, (error, found) => {
      const addresses = found as LookupAddress[];
      if (error) {
        callback(error, "", 0);
        return;
      }
      if (!allowLocal && addresses.some((entry) => isPrivateAddress(entry.address))) {
        callback(new Error(PRIVATE_NETWORK_ERROR), "", 0);
        return;
      }
      if (options.all) {
        callback(null, addresses);
      } else {
        callback(null, addresses[0].address, addresses[0].family);
      }
    });
  };
}

// POSTs a JSON body and resolves with the response status. Doesn't follow redirects (a redirect
// could point at a private address). Throws on network errors, timeouts and private addresses.
export function postJson(
  url: URL,
  headers: Record<string, string>,
  body: string,
  { timeoutMs, allowLocal }: { timeoutMs: number; allowLocal: boolean },
) {
  // An address typed as numbers skips the lookup above, so check it here.
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!allowLocal && isIP(host) && isPrivateAddress(host)) {
    return Promise.reject(new Error(PRIVATE_NETWORK_ERROR));
  }
  const send = url.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise<number>((resolve, reject) => {
    const req = send(
      url,
      {
        method: "POST",
        headers: { ...headers, "Content-Length": String(Buffer.byteLength(body)) },
        lookup: publicOnlyLookup(allowLocal),
        timeout: timeoutMs,
      },
      (response) => {
        // Only the status matters; read the rest so the connection is released.
        response.resume();
        resolve(response.statusCode ?? 0);
      },
    );
    req.on("timeout", () => req.destroy(new Error("The endpoint didn't answer in time.")));
    req.on("error", reject);
    req.end(body);
  });
}
