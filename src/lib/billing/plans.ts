import { formatDate } from "@/lib/format";

// Plans for the workspaces using your feedback app: limits, price and features shown on the
// pricing section and Billing page. Change the limits here; they're enforced on the server.
// The real price is set in Polar or Stripe; keep `price` here in sync with it.
export const plans = {
  free: {
    name: "Free",
    price: "$0",
    description: "For small teams starting to collect feedback.",
    memberLimit: 3,
    boardLimit: 2,
    // Custom domain, hiding "Powered by", and webhooks are Pro features.
    customDomain: false,
    removeBranding: false,
    webhooks: false,
    features: [
      "Public portal, roadmap and changelog",
      "Embeddable widget",
      "Email updates to voters",
    ],
  },
  pro: {
    name: "Pro",
    price: "$29/month",
    description: "For growing products that want it fully on-brand.",
    memberLimit: Infinity,
    boardLimit: Infinity,
    customDomain: true,
    removeBranding: true,
    webhooks: true,
    features: [
      "Everything in Free",
      'Custom domain, no "Powered by"',
      "Webhooks for Slack, Zapier and more",
      "Priority email support",
    ],
  },
} as const satisfies Record<string, PlanDetails>;

type PlanDetails = {
  name: string;
  price: string;
  description: string;
  memberLimit: number;
  boardLimit: number;
  customDomain: boolean;
  removeBranding: boolean;
  webhooks: boolean;
  features: readonly string[];
};

export type PlanId = keyof typeof plans;
export type Plan = (typeof plans)[PlanId];

// "Up to 3 members", "1 board", "Unlimited boards".
export function limitLabel(limit: number, singular: string, plural: string) {
  if (limit === Infinity) {
    return `Unlimited ${plural}`;
  }
  return limit === 1 ? `1 ${singular}` : `Up to ${limit} ${plural}`;
}

const PAID_STATUSES = ["active", "trialing"];

export function planFromStatus(status: string | null | undefined): PlanId {
  return status && PAID_STATUSES.includes(status) ? "pro" : "free";
}

// The subscription still exists but the last payment failed (e.g. an expired card).
// The owner should update the card in the billing portal, not start a new subscription.
const PAYMENT_PROBLEM_STATUSES = ["past_due", "unpaid", "incomplete"];

export function hasPaymentProblem(status: string | null | undefined) {
  return Boolean(status && PAYMENT_PROBLEM_STATUSES.includes(status));
}

type Env = Record<string, string | undefined>;

// BILLING_PROVIDER="none" turns payments off, for example when a company self-hosts the app for
// itself: then every workspace gets every feature.
export function billingEnabled(env: Env = process.env) {
  return env.BILLING_PROVIDER !== "none";
}

// The plan whose limits apply: the paid status, or Pro for everyone when billing is off.
export function effectivePlan(status: string | null | undefined, env: Env = process.env): PlanId {
  return billingEnabled(env) ? planFromStatus(status) : "pro";
}

// Statuses where Stripe or Polar charges the card again, or keeps retrying a failed payment.
const CHARGING_STATUSES = ["active", "trialing", "past_due", "unpaid"];

// True while the workspace would be charged again. Deleting it then would leave the
// subscription running, so the owner must cancel it in the billing portal first.
export function keepsCharging(subscription: { status: string; cancelAtPeriodEnd: boolean }) {
  return CHARGING_STATUSES.includes(subscription.status) && !subscription.cancelAtPeriodEnd;
}

type PeriodInfo = { status: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: Date | null };

// What happens when the current period ends, shown on the Billing page.
// A cancelled subscription keeps Pro until then, so say that clearly (also during a trial).
export function periodNote({ status, cancelAtPeriodEnd, currentPeriodEnd }: PeriodInfo) {
  if (!currentPeriodEnd) {
    return null;
  }
  const date = formatDate(currentPeriodEnd);
  if (cancelAtPeriodEnd) {
    return `Cancelled: Pro ends on ${date}, then you're back on Free.`;
  }
  return status === "trialing" ? `Free trial ends on ${date}.` : `Renews on ${date}.`;
}
