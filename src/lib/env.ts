import { isDemoMode } from "./demo";

type Env = Record<string, string | undefined>;

// Returns a list of problems with the environment variables. An empty list means all good.
export function checkEnv(env: Env = process.env) {
  const problems: string[] = [];
  const isProduction = env.NODE_ENV === "production";

  function required(name: string) {
    if (!env[name]) {
      problems.push(`${name} is missing.`);
    }
  }

  required("DATABASE_URL");
  required("BETTER_AUTH_SECRET");
  required("BETTER_AUTH_URL");

  const secret = env.BETTER_AUTH_SECRET;
  if (secret && secret.length < 32) {
    problems.push("BETTER_AUTH_SECRET must be at least 32 characters long.");
  }

  const url = env.BETTER_AUTH_URL;
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    problems.push(
      `BETTER_AUTH_URL "${url}" must start with http:// or https:// (example: http://localhost:3000).`,
    );
  } else if (url?.endsWith("/")) {
    problems.push("BETTER_AUTH_URL must not end with a slash.");
  }

  const demo = env.DEMO_MODE;
  if (demo && demo !== "true" && demo !== "false") {
    problems.push(`DEMO_MODE must be "true" or "false", not "${demo}".`);
  }

  // Without Resend, emails are only printed to the terminal, so nobody could verify their email.
  // Demo mode sends no emails and skips verification, so it doesn't need Resend.
  if (isProduction && !isDemoMode(env)) {
    required("RESEND_API_KEY");
  }

  const provider = env.BILLING_PROVIDER ?? "polar";
  if (provider === "polar") {
    required("POLAR_ACCESS_TOKEN");
    required("POLAR_PRO_PRODUCT_ID");
    if (isProduction) {
      required("POLAR_WEBHOOK_SECRET");
    }
    const server = env.POLAR_SERVER;
    if (server && server !== "sandbox" && server !== "production") {
      problems.push(`POLAR_SERVER must be "sandbox" or "production", not "${server}".`);
    }
  } else if (provider === "stripe") {
    required("STRIPE_SECRET_KEY");
    required("STRIPE_PRO_PRICE_ID");
    if (isProduction) {
      required("STRIPE_WEBHOOK_SECRET");
    }
    const days = env.STRIPE_TRIAL_DAYS;
    if (days && !/^\d+$/.test(days)) {
      problems.push(`STRIPE_TRIAL_DAYS must be a whole number of days, not "${days}".`);
    }
  } else {
    problems.push(`BILLING_PROVIDER must be "polar" or "stripe", not "${provider}".`);
  }

  return problems;
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  return value;
}
