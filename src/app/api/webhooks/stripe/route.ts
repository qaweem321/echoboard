import type Stripe from "stripe";
import { getBillingProvider, syncSubscription } from "@/lib/billing";
import { findOrganizationIdByStripeCustomer, getStripeClient } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await getStripeClient().webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  let customer: string | Stripe.Customer | Stripe.DeletedCustomer | null = null;
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      customer = event.data.object.customer;
      break;
    case "checkout.session.completed":
      customer = event.data.object.customer;
      break;
  }

  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (customerId && getBillingProvider().name === "stripe") {
    const organizationId = await findOrganizationIdByStripeCustomer(customerId);
    if (organizationId) {
      await syncSubscription(organizationId);
    }
  }
  return new Response(null, { status: 202 });
}
