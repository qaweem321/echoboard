import { PolarClientError } from "@polar-sh/sdk";
import { createPolar } from "@polar-sh/sdk/2026-10";
import { isReservedEmailDomain } from "@/lib/email-address";
import { requireEnv } from "@/lib/env";
import { type BillingProvider, PortalNotAllowedError } from "./types";

// Polar keeps one customer per email, and one person can pay for several organizations.
// So each subscription carries its organization in metadata (copied from the checkout),
// instead of relying on the customer.
export const ORGANIZATION_KEY = "organizationId";
const ENDED_STATUSES = ["canceled", "incomplete_expired"];

function getClient() {
  return createPolar({
    accessToken: requireEnv("POLAR_ACCESS_TOKEN"),
    environment: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });
}

async function findSubscription(organizationId: string) {
  const { items } = await getClient().subscriptions.list({
    metadata: { [ORGANIZATION_KEY]: organizationId },
    sorting: ["-started_at"],
    limit: 10,
  });
  return items.find((subscription) => !ENDED_STATUSES.includes(subscription.status)) ?? null;
}

export const polarProvider: BillingProvider = {
  name: "polar",

  async createCheckoutUrl({ organizationId, customerEmail, successUrl, cancelUrl }) {
    const create = (email?: string) =>
      getClient().checkouts.create({
        products: [requireEnv("POLAR_PRO_PRODUCT_ID")],
        metadata: { [ORGANIZATION_KEY]: organizationId },
        customer_email: email,
        success_url: successUrl,
        return_url: cancelUrl,
      });

    // Polar accepts a reserved test address (the demo's owner@acme.test) when creating the
    // checkout but refuses it at payment, so don't pre-fill those.
    const prefill = isReservedEmailDomain(customerEmail) ? undefined : customerEmail;
    try {
      return (await create(prefill)).url;
    } catch (error) {
      // Polar refuses some addresses (e.g. reserved test domains like example.test).
      // Then the payer simply types their email on the checkout page.
      if (error instanceof PolarClientError && error.statusCode === 422) {
        return (await create()).url;
      }
      throw error;
    }
  },

  async createPortalUrl({ organizationId, returnUrl, userEmail }) {
    const subscription = await findSubscription(organizationId);
    if (!subscription) {
      throw new Error("This organization has no Polar subscription yet.");
    }
    const payer = subscription.customer.email?.toLowerCase();
    if (payer && payer !== userEmail.toLowerCase()) {
      throw new PortalNotAllowedError(payer);
    }

    const session = await getClient().customerSessions.create({
      customer_id: subscription.customer_id,
      return_url: returnUrl,
    });
    return session.customer_portal_url;
  },

  async fetchSubscription(organizationId) {
    const subscription = await findSubscription(organizationId);
    if (!subscription) {
      return null;
    }
    return {
      providerCustomerId: subscription.customer_id,
      providerSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  },
};
