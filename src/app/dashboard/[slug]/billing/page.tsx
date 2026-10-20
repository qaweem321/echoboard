import type { Metadata } from "next";
import { PaymentProblemNotice } from "@/components/payment-problem-notice";
import { PlanCard } from "@/components/plan-card";
import { getOrganizationSubscription } from "@/lib/billing";
import {
  billingEnabled,
  hasPaymentProblem,
  periodNote,
  planFromStatus,
  plans,
} from "@/lib/billing/plans";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/session";
import { openBillingPortal, startCheckout } from "./actions";
import { BillingButton } from "./billing-button";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization, role } = await requireMembership(slug);
  if (!billingEnabled()) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Billing is turned off on this installation, so every workspace has all features.
        </p>
      </div>
    );
  }
  const subscription = await getOrganizationSubscription(organization.id);
  const planId = planFromStatus(subscription?.status);
  const canManage = can(role, "billing:manage");
  const paymentProblem = hasPaymentProblem(subscription?.status);
  const note = subscription && periodNote(subscription);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-1 text-muted-foreground">
        {organization.name} is on the{" "}
        <strong className="text-foreground">{plans[planId].name}</strong> plan.
        {note && ` ${note}`}
      </p>

      {paymentProblem && subscription && (
        <PaymentProblemNotice slug={slug} status={subscription.status} canManage={canManage} />
      )}

      {/* The plan cards use <h3>; this keeps the heading levels in order for screen readers. */}
      <h2 className="sr-only">Plans</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <PlanCard
          plan={plans.free}
          highlighted={planId === "free"}
          badge={planId === "free" ? "Current plan" : undefined}
        >
          {planId === "pro" && (
            <p className="text-sm text-subtle-foreground">
              {subscription?.cancelAtPeriodEnd
                ? "Your workspace moves here when Pro ends. Changed your mind? Resume under Manage subscription."
                : "To switch back, cancel under Manage subscription. You keep Pro until the period ends."}
            </p>
          )}
        </PlanCard>

        <PlanCard
          plan={plans.pro}
          highlighted={planId === "pro"}
          badge={planId === "pro" ? "Current plan" : undefined}
        >
          {!canManage ? (
            <p className="text-sm text-subtle-foreground">Only owners can change the plan.</p>
          ) : planId === "pro" || paymentProblem ? (
            <BillingButton slug={slug} action={openBillingPortal} label="Manage subscription" />
          ) : (
            <BillingButton slug={slug} action={startCheckout} label="Upgrade to Pro" />
          )}
        </PlanCard>
      </div>
    </div>
  );
}
