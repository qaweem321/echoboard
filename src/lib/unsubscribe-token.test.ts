import assert from "node:assert/strict";
import { test } from "node:test";
import { signUnsubscribe, verifyUnsubscribe } from "./unsubscribe-token";

const secret = "test-secret-that-is-long-enough-1234";

test("a signed link verifies", () => {
  const token = signUnsubscribe("voter-1", secret);
  assert.equal(verifyUnsubscribe("voter-1", token, secret), true);
});

test("a link for another voter or secret fails", () => {
  const token = signUnsubscribe("voter-1", secret);
  assert.equal(verifyUnsubscribe("voter-2", token, secret), false);
  assert.equal(verifyUnsubscribe("voter-1", token, `${secret}x`), false);
  assert.equal(verifyUnsubscribe("voter-1", "", secret), false);
  assert.equal(verifyUnsubscribe("voter-1", `${token}x`, secret), false);
});
