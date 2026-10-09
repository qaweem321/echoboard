import assert from "node:assert/strict";
import { test } from "node:test";
import { eventSummary, webhookBody, webhookFormat } from "./events";

const workspace = { id: "w1", name: "Acme", slug: "acme" };
const post = { id: "p1", title: "Dark mode", status: "planned" as const, url: "https://x.test/p" };

test("Slack and Discord URLs are recognised", () => {
  assert.equal(webhookFormat("https://hooks.slack.com/services/T/B/X"), "slack");
  assert.equal(webhookFormat("https://discord.com/api/webhooks/1/abc"), "discord");
  assert.equal(webhookFormat("https://hooks.zapier.com/hooks/catch/1/x"), "json");
});

test("summaries read well in a chat channel", () => {
  assert.equal(
    eventSummary(workspace, { type: "post.status_changed", post, previousStatus: "open" }),
    '[Acme] "Dark mode" is now Planned https://x.test/p',
  );
  const long = "x".repeat(300);
  const summary = eventSummary(workspace, {
    type: "comment.created",
    post,
    comment: { id: "c1", body: long, authorName: null },
  });
  assert.ok(summary.startsWith('[Acme] Someone commented on "Dark mode": '));
  assert.ok(summary.includes(`${"x".repeat(200)}...`));
});

test("JSON endpoints get the full event", () => {
  const body = JSON.parse(
    webhookBody(
      "json",
      workspace,
      { type: "post.created", post },
      new Date("2026-10-09T00:00:00Z"),
    ),
  );
  assert.deepEqual(body, {
    type: "post.created",
    timestamp: "2026-10-09T00:00:00.000Z",
    workspace,
    data: { post },
  });
  assert.deepEqual(JSON.parse(webhookBody("slack", workspace, { type: "ping" }, new Date())), {
    text: "[Acme] Test message: your webhook works.",
  });
});
