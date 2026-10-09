import { createHmac, randomBytes } from "node:crypto";

// Webhooks are signed the Standard Webhooks way (https://www.standardwebhooks.com), which many
// libraries can check: an HMAC-SHA256 of "<id>.<timestamp>.<body>" with the secret's bytes.

const PREFIX = "whsec_";

export function newWebhookSecret() {
  return `${PREFIX}${randomBytes(24).toString("base64")}`;
}

export function signWebhook(secret: string, id: string, timestamp: number, body: string) {
  const key = Buffer.from(
    secret.startsWith(PREFIX) ? secret.slice(PREFIX.length) : secret,
    "base64",
  );
  const digest = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return `v1,${digest}`;
}
