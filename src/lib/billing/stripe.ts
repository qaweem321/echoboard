import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { billingCustomers } from "@/db/schema";
import { requireEnv } from "@/lib/env";
import type { BillingProvider } from "./types";

const ENDED_STATUSES = ["canceled", "incomplete_expired"];

export function getStripeClient() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"));
}

async function findCustomerId(organizationId: string) {
  const [row] = await db
    .select({ providerCustomerId: billingCustomers.providerCustomerId })
    .from(billingCustomers)
    .where(
      and(
        eq(billingCustomers.organizationId, organizationId),
        eq(billingCustomers.provider, "stripe"),
      ),
    );
  return row?.providerCustomerId ?? null;
}

export async function findOrganizationIdByStripeCustomer(customerId: string) {
  const [row] = await db
    .select({ organizationId: billingCustomers.organizationId })
    .from(billingCustomers)
    .where(
      and(
        eq(billingCustomers.provider, "stripe"),
        eq(billingCustomers.providerCustomerId, customerId),
      ),
    );
  return row?.organizationId ?? null;
}

async function getOrCreateCustomerId(organizationId: string, email: string) {
  const existing = await findCustomerId(organizationId);
  if (existing) {
    return existing;
  }

  const customer = await getStripeClient().customers.create(
    { email, metadata: { organizationId } },
    { idempotencyKey: `customer-for-organization-${organizationId}` },
  );
  await db
    .insert(billingCustomers)
    .values({ organizationId, provider: "stripe", providerCustomerId: customer.id })
    .onConflictDoNothing();

  return (await findCustomerId(organizationId)) ?? customer.id;
}

function trialDays() {
  const days = Number(process.env.STRIPE_TRIAL_DAYS ?? 0);
  return Number.isInteger(days) && days > 0 ? days : undefined;
}

export const stripeProvider: BillingProvider = {
  name: "stripe",

  async createCheckoutUrl({ organizationId, customerEmail, successUrl, cancelUrl }) {
    const session = await getStripeClient().checkout.sessions.create({
      mode: "subscription",
      customer: await getOrCreateCustomerId(organizationId, customerEmail),
      client_reference_id: organizationId,
      line_items: [{ price: requireEnv("STRIPE_PRO_PRICE_ID"), quantity: 1 }],
      subscription_data: { metadata: { organizationId }, trial_period_days: trialDays() },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }
    return session.url;
  },

  async createPortalUrl({ organizationId, returnUrl }) {
    const customerId = await findCustomerId(organizationId);
    if (!customerId) {
      throw new Error("This organization has no Stripe customer yet.");
    }
    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  },

  async fetchSubscription(organizationId) {
    const customerId = await findCustomerId(organizationId);
    if (!customerId) {
      return null;
    }

    const { data } = await getStripeClient().subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    const subscription = data.find((s) => !ENDED_STATUSES.includes(s.status));
    if (!subscription) {
      return null;
    }

    const periodEnd = subscription.items.data[0]?.current_period_end;
    return {
      providerCustomerId: customerId,
      providerSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.cancel_at !== null,
    };
  },
};
