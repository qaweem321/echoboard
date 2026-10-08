import assert from "node:assert/strict";
import { test } from "node:test";
import { clientIp } from "./client-ip";

test("uses the first forwarded address", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": " 1.2.3.4 , 10.0.0.1" })), "1.2.3.4");
});

test("falls back to x-real-ip, then unknown", () => {
  assert.equal(clientIp(new Headers({ "x-real-ip": "5.6.7.8" })), "5.6.7.8");
  assert.equal(clientIp(new Headers()), "unknown");
});
