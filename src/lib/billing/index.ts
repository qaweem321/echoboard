import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
import { type PlanId, planFromStatus } from "./plans";
import { polarProvider } from "./polar";
import { stripeProvider } from "./stripe";
import type { BillingProvider } from "./types";

export function getBillingProvider(): BillingProvider {
  const provider = process.env.BILLING_PROVIDER ?? "polar";
  if (provider === "polar") {
    return polarProvider;
  }
  if (provider === "stripe") {
    return stripeProvider;
  }
  throw new Error(`Unknown BILLING_PROVIDER "${provider}". Use "polar" or "stripe".`);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function syncSubscription(organizationId: string) {
  if (!UUID_PATTERN.test(organizationId)) {
    return;
  }
  const exists = await db.$count(organizations, eq(organizations.id, organizationId));
  if (exists === 0) {
    return;
  }

  const provider = getBillingProvider();
  const subscription = await provider.fetchSubscription(organizationId);

  if (!subscription) {
    await db.delete(subscriptions).where(eq(subscriptions.organizationId, organizationId));
    return;
  }

  const values = { ...subscription, provider: provider.name, updatedAt: new Date() };
  await db
    .insert(subscriptions)
    .values({ organizationId, ...values })
    .onConflictDoUpdate({ target: subscriptions.organizationId, set: values });
}

export async function getOrganizationSubscription(organizationId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId));
  return subscription ?? null;
}

export async function getOrganizationPlan(organizationId: string): Promise<PlanId> {
  const subscription = await getOrganizationSubscription(organizationId);
  return planFromStatus(subscription?.status);
}

// True while the organization would be charged again. Deleting it now would leave a
// subscription running, so the owner must cancel it in the billing portal first.
export async function hasRenewingSubscription(organizationId: string) {
  const subscription = await getOrganizationSubscription(organizationId);
  return (
    subscription !== null &&
    planFromStatus(subscription.status) === "pro" &&
    !subscription.cancelAtPeriodEnd
  );
}
