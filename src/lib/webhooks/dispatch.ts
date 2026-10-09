import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { siteConfig } from "@/config/site";
import { db } from "@/db";
import { subscriptions, webhooks } from "@/db/schema";
import { effectivePlan, plans } from "@/lib/billing/plans";
import { type WebhookEvent, type Workspace, webhookBody, webhookFormat } from "./events";
import { signWebhook } from "./signature";
import { isPrivateAddress } from "./url";

const TIMEOUT_MS = 5000;
const ERROR_MAX = 300;

// Local endpoints are allowed while developing only (see checkWebhookUrl).
function allowLocal() {
  return process.env.NODE_ENV !== "production";
}

type Endpoint = { id: string; url: string; secret: string };
type Delivery = { status: number | null; error: string | null };

// Sends one event to one endpoint. Never throws: the result is stored for the Webhooks page.
async function deliver(endpoint: Endpoint, workspace: Workspace, event: WebhookEvent) {
  try {
    const url = new URL(endpoint.url);
    // Check where the name points right before sending, so a domain can't be switched to a
    // private address after it was saved.
    if (!allowLocal()) {
      const addresses = await lookup(url.hostname, { all: true });
      if (addresses.some((entry) => isPrivateAddress(entry.address))) {
        return { status: null, error: "The address points to a private network." };
      }
    }
    const sentAt = new Date();
    const body = webhookBody(webhookFormat(endpoint.url), workspace, event, sentAt);
    const id = `msg_${randomUUID()}`;
    const timestamp = Math.floor(sentAt.getTime() / 1000);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `${siteConfig.name}-Webhooks`,
        "webhook-id": id,
        "webhook-timestamp": String(timestamp),
        "webhook-signature": signWebhook(endpoint.secret, id, timestamp, body),
      },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return {
      status: response.status,
      error: response.ok ? null : `The endpoint answered ${response.status}.`,
    } satisfies Delivery;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: null, error: message.slice(0, ERROR_MAX) } satisfies Delivery;
  }
}

async function recordDelivery(endpointId: string, delivery: Delivery) {
  await db
    .update(webhooks)
    .set({ lastStatus: delivery.status, lastError: delivery.error, lastAttemptAt: new Date() })
    .where(eq(webhooks.id, endpointId));
}

// Sends events to all of a workspace's endpoints (Pro plan only). Runs after the response,
// so a slow endpoint never slows the page. One attempt each, in order per endpoint; the last
// result shows on the Webhooks page.
export function emitWebhookEvents(workspace: Workspace, events: WebhookEvent[]) {
  if (events.length === 0) {
    return;
  }
  after(async () => {
    try {
      const rows = await db
        .select({
          id: webhooks.id,
          url: webhooks.url,
          secret: webhooks.secret,
          status: subscriptions.status,
        })
        .from(webhooks)
        .leftJoin(subscriptions, eq(subscriptions.organizationId, webhooks.organizationId))
        .where(eq(webhooks.organizationId, workspace.id));
      if (rows.length === 0 || !plans[effectivePlan(rows[0].status)].webhooks) {
        return;
      }
      await Promise.all(
        rows.map(async (row) => {
          let delivery: Delivery = { status: null, error: null };
          for (const event of events) {
            delivery = await deliver(row, workspace, event);
          }
          await recordDelivery(row.id, delivery);
        }),
      );
    } catch (error) {
      console.error("Sending webhooks failed:", error);
    }
  });
}

export function emitWebhookEvent(workspace: Workspace, event: WebhookEvent) {
  emitWebhookEvents(workspace, [event]);
}

// For the "Send test" button: sends a ping now and returns the result.
export async function sendTestWebhook(endpoint: Endpoint, workspace: Workspace) {
  const delivery = await deliver(endpoint, workspace, { type: "ping" });
  await recordDelivery(endpoint.id, delivery);
  return delivery;
}
