import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { CodeSnippet } from "@/components/code-snippet";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { getPlanLimits } from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/session";
import { WEBHOOK_LIMIT } from "@/lib/webhooks/config";
import { deleteWebhook } from "./actions";
import { AddWebhookForm } from "./add-webhook-form";
import { TestWebhookButton } from "./test-webhook-button";

export const metadata: Metadata = { title: "Webhooks" };

const events = [
  ["post.created", "someone shares a new idea"],
  ["comment.created", "someone comments on an idea"],
  ["post.status_changed", "an idea's status changes (for example to Complete)"],
  ["changelog.published", "a changelog entry is published"],
];

export default async function WebhooksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization, role } = await requireMembership(slug);
  if (!can(role, "webhooks:manage")) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <p className="mt-1 text-muted-foreground">Only owners and admins can manage webhooks.</p>
      </div>
    );
  }
  const [plan, rows] = await Promise.all([
    getPlanLimits(organization.id),
    db
      .select()
      .from(webhooks)
      .where(eq(webhooks.organizationId, organization.id))
      .orderBy(asc(webhooks.createdAt)),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <p className="mt-1 text-muted-foreground">
          Send new feedback to Slack, Discord, Zapier, Make or your own app. Paste a Slack or
          Discord &ldquo;incoming webhook&rdquo; address to get a message in a channel; other
          addresses get the full event as JSON.
        </p>
      </div>

      {!plan.webhooks ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="font-medium">Webhooks are part of Pro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <a href={`/dashboard/${slug}/billing`} className="text-link hover:underline">
              Upgrade under Billing
            </a>{" "}
            to connect your tools.
          </p>
        </div>
      ) : (
        <>
          {rows.length < WEBHOOK_LIMIT && <AddWebhookForm slug={slug} />}
          {rows.length === 0 ? (
            <p className="text-sm text-subtle-foreground">No webhooks yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {rows.map((webhook) => (
                <li key={webhook.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="min-w-0 break-all font-mono text-sm">{webhook.url}</p>
                    <form action={deleteWebhook}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="webhookId" value={webhook.id} />
                      <SubmitButton
                        variant="danger-link"
                        size="inline"
                        pendingText="Removing..."
                        confirm="Remove this webhook? It stops getting events right away."
                      >
                        Remove
                      </SubmitButton>
                    </form>
                  </div>
                  <p className="text-xs text-subtle-foreground">
                    {webhook.lastAttemptAt
                      ? `Last sent ${formatDate(webhook.lastAttemptAt)}: ${webhook.lastError ?? `delivered (${webhook.lastStatus})`}`
                      : "Nothing sent yet."}
                  </p>
                  <TestWebhookButton slug={slug} webhookId={webhook.id} />
                  <details className="text-sm">
                    <summary className="cursor-pointer text-link">Signing secret</summary>
                    <div className="mt-2 space-y-2">
                      <p className="text-muted-foreground">
                        Requests carry <code>webhook-id</code>, <code>webhook-timestamp</code> and{" "}
                        <code>webhook-signature</code> headers (Standard Webhooks). Check them with
                        this secret to be sure a request came from us.
                      </p>
                      <CodeSnippet code={webhook.secret} label="Signing secret" />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Events</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {events.map(([name, description]) => (
            <li key={name}>
              <code className="text-foreground">{name}</code>: {description}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
