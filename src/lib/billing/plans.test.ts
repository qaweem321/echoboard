import assert from "node:assert/strict";
import { test } from "node:test";
import { hasPaymentProblem, memberLimitLabel, planFromStatus } from "./plans";

test("active and trialing subscriptions are Pro", () => {
  assert.equal(planFromStatus("active"), "pro");
  assert.equal(planFromStatus("trialing"), "pro");
});

test("everything else is Free", () => {
  for (const status of ["canceled", "past_due", "incomplete", "unpaid", "", null, undefined]) {
    assert.equal(planFromStatus(status), "free", String(status));
  }
});

test("describes member limits", () => {
  assert.equal(memberLimitLabel(3), "Up to 3 members");
  assert.equal(memberLimitLabel(Infinity), "Unlimited members");
});

test("failed payments are detected", () => {
  for (const status of ["past_due", "unpaid", "incomplete"]) {
    assert.equal(hasPaymentProblem(status), true, status);
  }
  for (const status of ["active", "trialing", "canceled", null, undefined]) {
    assert.equal(hasPaymentProblem(status), false, String(status));
  }
});
