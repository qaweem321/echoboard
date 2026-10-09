"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { getPlanLimits } from "@/lib/billing";
import { DEMO_DISABLED_MESSAGE, isDemoMode } from "@/lib/demo";
import { requirePermission } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { WEBHOOK_LIMIT } from "@/lib/webhooks/config";
import { sendTestWebhook } from "@/lib/webhooks/dispatch";
import { newWebhookSecret } from "@/lib/webhooks/signature";
import { checkWebhookUrl } from "@/lib/webhooks/url";

function refresh(slug: string) {
  revalidatePath(`/dashboard/${slug}/webhooks`);
}

export type AddWebhookState = { error?: string; url?: string };

export async function addWebhook(
  _previous: AddWebhookState,
  formData: FormData,
): Promise<AddWebhookState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "webhooks:manage");
  const raw = String(formData.get("url") ?? "");
  // A public demo must not send requests to addresses visitors type in.
  if (isDemoMode()) {
    return { error: DEMO_DISABLED_MESSAGE, url: raw };
  }

  const checked = checkWebhookUrl(raw, process.env.NODE_ENV !== "production");
  if ("error" in checked) {
    return { error: checked.error, url: raw };
  }
  const [plan, count] = await Promise.all([
    getPlanLimits(organization.id),
    db.$count(webhooks, eq(webhooks.organizationId, organization.id)),
  ]);
  if (!plan.webhooks) {
    return { error: "Webhooks are a Pro feature. Upgrade under Billing.", url: raw };
  }
  if (count >= WEBHOOK_LIMIT) {
    return { error: `You can add up to ${WEBHOOK_LIMIT} webhooks.`, url: raw };
  }
  await db.insert(webhooks).values({
    organizationId: organization.id,
    url: checked.url,
    secret: newWebhookSecret(),
  });
  refresh(slug);
  return {};
}

// The webhook (ID from the browser) if it belongs to this workspace.
async function requireWebhook(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "webhooks:manage");
  const webhookId = formData.get("webhookId");
  const [webhook] = isUuid(webhookId)
    ? await db
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.id, webhookId), eq(webhooks.organizationId, organization.id)))
        .limit(1)
    : [];
  if (!webhook) {
    throw new Error("Webhook not found.");
  }
  return { slug, organization, webhook };
}

export async function deleteWebhook(formData: FormData) {
  const { slug, webhook } = await requireWebhook(formData);
  await db.delete(webhooks).where(eq(webhooks.id, webhook.id));
  refresh(slug);
}

export type TestWebhookState = { result?: string; ok?: boolean };

export async function testWebhook(
  _previous: TestWebhookState,
  formData: FormData,
): Promise<TestWebhookState> {
  const { slug, organization, webhook } = await requireWebhook(formData);
  const delivery = await sendTestWebhook(webhook, organization);
  refresh(slug);
  return delivery.error
    ? { ok: false, result: `Failed: ${delivery.error}` }
    : { ok: true, result: `Delivered (${delivery.status}).` };
}
