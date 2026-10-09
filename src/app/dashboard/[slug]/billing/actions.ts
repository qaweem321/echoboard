"use server";

import { redirect } from "next/navigation";
import { absoluteUrl } from "@/config/site";
import { getBillingProvider, getOrganizationSubscription } from "@/lib/billing";
import { billingEnabled, hasPaymentProblem, planFromStatus } from "@/lib/billing/plans";
import { requirePermission } from "@/lib/session";

export type BillingActionState = { error?: string };

const PROVIDER_ERROR = "We couldn't reach the payment provider. Please try again in a moment.";

export async function startCheckout(
  _previous: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const slug = String(formData.get("slug"));
  const { user, organization } = await requirePermission(slug, "billing:manage");
  if (!billingEnabled()) {
    return { error: "Billing is turned off on this installation." };
  }

  // Never start a second subscription for the same organization.
  const subscription = await getOrganizationSubscription(organization.id);
  if (planFromStatus(subscription?.status) === "pro" || hasPaymentProblem(subscription?.status)) {
    return { error: "This workspace already has a subscription. Use Manage subscription." };
  }

  let url: string;
  try {
    url = await getBillingProvider().createCheckoutUrl({
      organizationId: organization.id,
      customerEmail: user.email,
      successUrl: absoluteUrl(`/dashboard/${slug}/billing/success`),
      cancelUrl: absoluteUrl(`/dashboard/${slug}/billing`),
    });
  } catch (error) {
    console.error("Checkout failed:", error);
    return { error: PROVIDER_ERROR };
  }
  redirect(url);
}

export async function openBillingPortal(
  _previous: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "billing:manage");
  if (!billingEnabled()) {
    return { error: "Billing is turned off on this installation." };
  }

  let url: string;
  try {
    url = await getBillingProvider().createPortalUrl({
      organizationId: organization.id,
      returnUrl: absoluteUrl(`/dashboard/${slug}/billing`),
    });
  } catch (error) {
    console.error("Billing portal failed:", error);
    return { error: PROVIDER_ERROR };
  }
  redirect(url);
}
