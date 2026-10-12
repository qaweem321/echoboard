export type ProviderSubscription = {
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type BillingProvider = {
  name: "polar" | "stripe";
  createCheckoutUrl(input: {
    organizationId: string;
    // Pre-fills the checkout, so the payer doesn't have to type it.
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string>;
  // `userEmail`: who is asking. Polar only lets the payer in (see PortalNotAllowedError).
  createPortalUrl(input: {
    organizationId: string;
    returnUrl: string;
    userEmail: string;
  }): Promise<string>;
  fetchSubscription(organizationId: string): Promise<ProviderSubscription | null>;
};

// Polar's portal belongs to the paying person and shows all of their subscriptions, invoices and
// card, also for other workspaces. So only the payer may open it, not a co-owner.
export class PortalNotAllowedError extends Error {
  constructor(readonly payerEmail: string) {
    super("Only the person who pays can open the billing portal.");
  }
}
