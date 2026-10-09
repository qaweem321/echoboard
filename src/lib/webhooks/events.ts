import { type PostStatus, postStatusLabels } from "@/lib/post-status";

// What webhooks send. JSON endpoints get the full event; Slack and Discord get a one-line
// message they can show in a channel.

export type PostRef = { id: string; title: string; status: PostStatus; url: string };

export type WebhookEvent =
  | { type: "post.created"; post: PostRef }
  | { type: "post.status_changed"; post: PostRef; previousStatus: PostStatus }
  | {
      type: "comment.created";
      post: PostRef;
      comment: { id: string; body: string; authorName: string | null };
    }
  | { type: "changelog.published"; entry: { id: string; title: string; url: string } }
  | { type: "ping" };

export type Workspace = { id: string; name: string; slug: string };

export type WebhookFormat = "json" | "slack" | "discord";

// Slack and Discord "incoming webhook" URLs expect their own message format.
export function webhookFormat(url: string): WebhookFormat {
  const host = new URL(url).hostname;
  if (host === "hooks.slack.com") {
    return "slack";
  }
  if ((host === "discord.com" || host === "discordapp.com") && url.includes("/api/webhooks/")) {
    return "discord";
  }
  return "json";
}

const COMMENT_PREVIEW = 200;

export function eventSummary(workspace: Workspace, event: WebhookEvent) {
  const prefix = `[${workspace.name}]`;
  switch (event.type) {
    case "post.created":
      return `${prefix} New idea: "${event.post.title}" ${event.post.url}`;
    case "post.status_changed":
      return `${prefix} "${event.post.title}" is now ${postStatusLabels[event.post.status]} ${event.post.url}`;
    case "comment.created": {
      const body = event.comment.body;
      const preview = body.length > COMMENT_PREVIEW ? `${body.slice(0, COMMENT_PREVIEW)}...` : body;
      return `${prefix} ${event.comment.authorName ?? "Someone"} commented on "${event.post.title}": ${preview} ${event.post.url}`;
    }
    case "changelog.published":
      return `${prefix} Published: "${event.entry.title}" ${event.entry.url}`;
    case "ping":
      return `${prefix} Test message: your webhook works.`;
  }
}

// The request body for one endpoint.
export function webhookBody(
  format: WebhookFormat,
  workspace: Workspace,
  event: WebhookEvent,
  sentAt: Date,
) {
  if (format === "slack") {
    return JSON.stringify({ text: eventSummary(workspace, event) });
  }
  if (format === "discord") {
    return JSON.stringify({ content: eventSummary(workspace, event) });
  }
  const { type, ...data } = event;
  return JSON.stringify({
    type,
    timestamp: sentAt.toISOString(),
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    data,
  });
}
