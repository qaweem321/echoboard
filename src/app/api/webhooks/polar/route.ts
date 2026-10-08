import { webhooks } from "@polar-sh/sdk/2026-10";
import { getBillingProvider, syncSubscription } from "@/lib/billing";
import { ORGANIZATION_KEY } from "@/lib/billing/polar";

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "POLAR_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const body = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
  };

  let event: Awaited<ReturnType<typeof webhooks.validateEvent>>;
  try {
    event = await webhooks.validateEvent(body, headers, secret);
  } catch (error) {
    if (error instanceof webhooks.PolarWebhookVerificationError) {
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }
    if (error instanceof webhooks.PolarWebhookUnknownTypeError) {
      return new Response(null, { status: 202 });
    }
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Each subscription carries its organization in metadata (see src/lib/billing/polar.ts).
  let organizationId: unknown;
  if (event.type.startsWith("subscription.") && "metadata" in event.data) {
    organizationId = event.data.metadata[ORGANIZATION_KEY];
  }

  if (typeof organizationId === "string" && getBillingProvider().name === "polar") {
    await syncSubscription(organizationId);
  }
  return new Response(null, { status: 202 });
}
