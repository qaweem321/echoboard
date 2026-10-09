import assert from "node:assert/strict";
import { test } from "node:test";
import {
  billingEnabled,
  effectivePlan,
  hasPaymentProblem,
  limitLabel,
  planFromStatus,
  plans,
} from "./plans";

test("active and trialing subscriptions are Pro", () => {
  assert.equal(planFromStatus("active"), "pro");
  assert.equal(planFromStatus("trialing"), "pro");
});

test("everything else is Free", () => {
  for (const status of ["canceled", "past_due", "incomplete", "unpaid", "", null, undefined]) {
    assert.equal(planFromStatus(status), "free", String(status));
  }
});

test("describes limits", () => {
  assert.equal(limitLabel(3, "member", "members"), "Up to 3 members");
  assert.equal(limitLabel(Infinity, "member", "members"), "Unlimited members");
  assert.equal(limitLabel(1, "board", "boards"), "1 board");
});

test("failed payments are detected", () => {
  for (const status of ["past_due", "unpaid", "incomplete"]) {
    assert.equal(hasPaymentProblem(status), true, status);
  }
  for (const status of ["active", "trialing", "canceled", null, undefined]) {
    assert.equal(hasPaymentProblem(status), false, String(status));
  }
});

test("Pro unlocks everything Free limits", () => {
  assert.ok(plans.pro.boardLimit > plans.free.boardLimit);
  assert.equal(plans.free.customDomain, false);
  assert.equal(plans.pro.customDomain && plans.pro.removeBranding && plans.pro.webhooks, true);
});

test("with billing off, every workspace gets Pro", () => {
  assert.equal(billingEnabled({ BILLING_PROVIDER: "none" }), false);
  assert.equal(billingEnabled({ BILLING_PROVIDER: "stripe" }), true);
  assert.equal(billingEnabled({}), true);
  assert.equal(effectivePlan(null, { BILLING_PROVIDER: "none" }), "pro");
  assert.equal(effectivePlan(null, { BILLING_PROVIDER: "polar" }), "free");
  assert.equal(effectivePlan("active", { BILLING_PROVIDER: "polar" }), "pro");
});
