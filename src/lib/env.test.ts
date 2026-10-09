import assert from "node:assert/strict";
import { test } from "node:test";
import { checkEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@host/db",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  BILLING_PROVIDER: "polar",
  POLAR_ACCESS_TOKEN: "token",
  POLAR_PRO_PRODUCT_ID: "product",
};

test("a complete development env has no problems", () => {
  assert.deepEqual(checkEnv(valid), []);
});

test("reports missing and badly formatted values", () => {
  const problems = checkEnv({ ...valid, DATABASE_URL: "", BETTER_AUTH_SECRET: "short" });
  assert.deepEqual(problems, [
    "DATABASE_URL is missing.",
    "BETTER_AUTH_SECRET must be at least 32 characters long.",
  ]);
});

test("rejects an invalid or slash-ending BETTER_AUTH_URL", () => {
  assert.equal(checkEnv({ ...valid, BETTER_AUTH_URL: "localhost:3000" }).length, 1);
  assert.equal(checkEnv({ ...valid, BETTER_AUTH_URL: "http://localhost:3000/" }).length, 1);
});

test("production also needs Resend and the webhook secret", () => {
  assert.deepEqual(checkEnv({ ...valid, NODE_ENV: "production" }), [
    "RESEND_API_KEY is missing.",
    "POLAR_WEBHOOK_SECRET is missing.",
  ]);
});

test("demo mode doesn't need Resend and must be true or false", () => {
  assert.deepEqual(checkEnv({ ...valid, NODE_ENV: "production", DEMO_MODE: "true" }), [
    "POLAR_WEBHOOK_SECRET is missing.",
  ]);
  assert.deepEqual(checkEnv({ ...valid, DEMO_MODE: "on" }), [
    'DEMO_MODE must be "true" or "false", not "on".',
  ]);
});

test("checks the Stripe variables when Stripe is chosen", () => {
  const problems = checkEnv({ ...valid, BILLING_PROVIDER: "stripe", STRIPE_TRIAL_DAYS: "7 days" });
  assert.deepEqual(problems, [
    "STRIPE_SECRET_KEY is missing.",
    "STRIPE_PRO_PRICE_ID is missing.",
    'STRIPE_TRIAL_DAYS must be a whole number of days, not "7 days".',
  ]);
});

test("rejects an unknown billing provider", () => {
  assert.equal(checkEnv({ ...valid, BILLING_PROVIDER: "paypal" }).length, 1);
});

test("billing can be turned off without any payment keys", () => {
  assert.deepEqual(
    checkEnv({
      DATABASE_URL: valid.DATABASE_URL,
      BETTER_AUTH_SECRET: valid.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: valid.BETTER_AUTH_URL,
      BILLING_PROVIDER: "none",
    }),
    [],
  );
});

test("checks DATABASE_DRIVER", () => {
  assert.deepEqual(checkEnv({ ...valid, DATABASE_DRIVER: "postgres" }), []);
  assert.equal(checkEnv({ ...valid, DATABASE_DRIVER: "mysql" }).length, 1);
});
