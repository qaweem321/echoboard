import assert from "node:assert/strict";
import { test } from "node:test";
import { customDomainPath, hostName } from "./custom-domain";

test("portal pages map into the workspace's portal", () => {
  assert.equal(customDomainPath("/", "acme"), "/p/acme");
  assert.equal(customDomainPath("/roadmap", "acme"), "/p/acme/roadmap");
  assert.equal(customDomainPath("/posts/123", "acme"), "/p/acme/posts/123");
});

test("shared files and the workspace's own portal paths pass through", () => {
  for (const path of ["/_next/static/x.js", "/api/embed/acme/posts", "/widget.js", "/embed/acme"]) {
    assert.equal(customDomainPath(path, "acme"), null, path);
  }
  assert.equal(customDomainPath("/unsubscribe", "acme"), null);
  assert.equal(customDomainPath("/p/acme/roadmap", "acme"), null);
});

test("nothing else is reachable on a customer's domain", () => {
  assert.equal(customDomainPath("/dashboard", "acme"), "/p/acme/dashboard");
  assert.equal(customDomainPath("/p/other", "acme"), "/p/acme/p/other");
  assert.equal(customDomainPath("/unsubscribed", "acme"), "/p/acme/unsubscribed");
  assert.equal(customDomainPath("/apis", "acme"), "/p/acme/apis");
  assert.equal(customDomainPath("/embed/other", "acme"), "/p/acme/embed/other");
  assert.equal(customDomainPath("/api/embed/other/posts", "acme"), "/p/acme/api/embed/other/posts");
  assert.equal(
    customDomainPath("/api/auth/sign-in/email", "acme"),
    "/p/acme/api/auth/sign-in/email",
  );
});

test("hostName drops the port and lowercases", () => {
  assert.equal(hostName("Feedback.Acme.com:443"), "feedback.acme.com");
  assert.equal(hostName(null), "");
});
