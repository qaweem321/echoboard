import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
import { billingEnabled, effectivePlan, keepsCharging, type PlanId, plans } from "./plans";
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
  throw new Error(`Billing is not available with BILLING_PROVIDER "${provider}".`);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Copies the organization's subscription from the payment provider into the database, and
// returns it (null when there's none).
export async function syncSubscription(organizationId: string) {
  if (!UUID_PATTERN.test(organizationId)) {
    return null;
  }
  const exists = await db.$count(organizations, eq(organizations.id, organizationId));
  if (exists === 0) {
    return null;
  }

  const provider = getBillingProvider();
  const subscription = await provider.fetchSubscription(organizationId);

  if (!subscription) {
    await db.delete(subscriptions).where(eq(subscriptions.organizationId, organizationId));
    return null;
  }

  const values = { ...subscription, provider: provider.name, updatedAt: new Date() };
  await db
    .insert(subscriptions)
    .values({ organizationId, ...values })
    .onConflictDoUpdate({ target: subscriptions.organizationId, set: values });
  return subscription;
}

export async function getOrganizationSubscription(organizationId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId));
  return subscription ?? null;
}

export async function getOrganizationPlan(organizationId: string): Promise<PlanId> {
  if (!billingEnabled()) {
    return "pro";
  }
  const subscription = await getOrganizationSubscription(organizationId);
  return effectivePlan(subscription?.status);
}

// The organization's plan with its limits, e.g. `(await getPlanLimits(id)).boardLimit`.
export async function getPlanLimits(organizationId: string) {
  return plans[await getOrganizationPlan(organizationId)];
}

// Workspaces (of these) whose subscription would charge again, also after a failed payment.
// One query for any number of workspaces.
export async function organizationsStillCharged(organizationIds: string[]) {
  if (organizationIds.length === 0) {
    return new Set<string>();
  }
  const rows = await db
    .select({
      organizationId: subscriptions.organizationId,
      status: subscriptions.status,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions)
    .where(inArray(subscriptions.organizationId, organizationIds));
  return new Set(rows.filter(keepsCharging).map((row) => row.organizationId));
}
