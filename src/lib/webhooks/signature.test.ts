import assert from "node:assert/strict";
import { test } from "node:test";
import { newWebhookSecret, signWebhook } from "./signature";

test("matches the Standard Webhooks example", () => {
  assert.equal(
    signWebhook(
      "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
      "msg_p5jXN8AQM9LWM0D4loKWxJek",
      1614265330,
      '{"test": 2432232314}',
    ),
    "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
  );
});

test("new secrets are random and prefixed", () => {
  const secret = newWebhookSecret();
  assert.match(secret, /^whsec_[A-Za-z0-9+/=]{32}$/);
  assert.notEqual(secret, newWebhookSecret());
});
