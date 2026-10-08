import assert from "node:assert/strict";
import { test } from "node:test";
import { buildUpdateEmail } from "./update-email";

const base = {
  organizationName: "Acme",
  recipientName: null,
  statusLabel: "Complete",
  unsubscribeUrl: "https://app.test/unsubscribe?v=1&t=abc",
};

test("one idea: the subject names it", () => {
  const email = buildUpdateEmail({
    ...base,
    posts: [{ title: "Dark mode", url: "https://app.test/p/acme/posts/1" }],
  });
  assert.equal(email.subject, "Complete: Dark mode");
  assert.ok(email.text.startsWith("Hi there,"));
  assert.ok(email.text.includes("Unsubscribe: https://app.test/unsubscribe?v=1&t=abc"));
});

test("several ideas are listed in one email", () => {
  const email = buildUpdateEmail({
    ...base,
    recipientName: "Dana",
    posts: [
      { title: "A", url: "https://app.test/a" },
      { title: "B", url: "https://app.test/b" },
    ],
    announcement: { title: "October release", url: "https://app.test/c" },
  });
  assert.equal(email.subject, "2 ideas you voted for are now complete");
  assert.ok(email.text.includes("- A: https://app.test/a"));
  assert.ok(email.text.includes("October release"));
  assert.ok(email.html.includes("Hi Dana,"));
});

test("titles typed by visitors can't inject HTML", () => {
  const email = buildUpdateEmail({
    ...base,
    posts: [{ title: "<img src=x onerror=alert(1)>", url: "https://app.test/a?x=1&y=2" }],
  });
  assert.ok(!email.html.includes("<img"));
  assert.ok(email.html.includes("https://app.test/a?x=1&amp;y=2"));
});
