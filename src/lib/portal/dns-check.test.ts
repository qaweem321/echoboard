import assert from "node:assert/strict";
import { test } from "node:test";
import { domainVerification } from "./dns-check";

test("the domain TXT record is the same each time, but differs per workspace and domain", () => {
  const first = domainVerification("org-1", "feedback.acme.com", "secret");
  assert.deepEqual(domainVerification("org-1", "feedback.acme.com", "secret"), first);
  assert.equal(first.name, "_portal-verify.feedback.acme.com");
  assert.match(first.value, /^portal-verify=[\w-]{32}$/);
  assert.notEqual(domainVerification("org-2", "feedback.acme.com", "secret").value, first.value);
  assert.notEqual(domainVerification("org-1", "ideas.acme.com", "secret").value, first.value);
  assert.notEqual(domainVerification("org-1", "feedback.acme.com", "other").value, first.value);
});
