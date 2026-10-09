type Env = Record<string, string | undefined>;

// Demo mode is for a public demo without a verified email domain: sign-up skips email
// verification, no emails are sent and a banner explains it. Off unless DEMO_MODE="true".
export function isDemoMode(env: Env = process.env) {
  return env.DEMO_MODE === "true";
}

// Card details that work in Polar's sandbox and Stripe's test mode (no real money).
export const demoTestCard = { number: "4242 4242 4242 4242", expiry: "12/34", cvc: "123" };

// The sample workspace's owner login, created by `npm run db:seed`. Shown on the demo banner.
export const demoLogin = { email: "owner@acme.test", password: "echoboard-demo" };

export const DEMO_DISABLED_MESSAGE = "This is turned off in the live demo.";
