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
  createPortalUrl(input: { organizationId: string; returnUrl: string }): Promise<string>;
  fetchSubscription(organizationId: string): Promise<ProviderSubscription | null>;
};
