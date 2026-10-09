import assert from "node:assert/strict";
import { test } from "node:test";
import { checkWebhookUrl, isPrivateAddress } from "./url";

test("private and local addresses are detected", () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "fd00::1",
    "::ffff:10.0.0.1",
    "0.0.0.0",
    "100.64.0.1",
  ]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700::1111", "hooks.slack.com"]) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});

test("webhook URLs must be public https", () => {
  assert.deepEqual(checkWebhookUrl(" https://hooks.slack.com/services/T/B/X ", false), {
    url: "https://hooks.slack.com/services/T/B/X",
  });
  for (const bad of [
    "http://example.com/hook",
    "https://localhost/hook",
    "https://127.0.0.1/x",
    "https://[::1]/x",
    "https://user:pw@example.com/x",
    "ftp://example.com",
    "nope",
    "",
  ]) {
    assert.ok("error" in checkWebhookUrl(bad, false), bad);
  }
});

test("developers may use localhost while building", () => {
  assert.deepEqual(checkWebhookUrl("http://localhost:4000/hook", true), {
    url: "http://localhost:4000/hook",
  });
  assert.ok("error" in checkWebhookUrl("http://example.com/hook", true));
});
