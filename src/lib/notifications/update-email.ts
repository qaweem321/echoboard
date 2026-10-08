import { escapeHtml } from "@/lib/email";

export type UpdateEmailInput = {
  organizationName: string;
  recipientName: string | null;
  // The new status label, e.g. "Complete".
  statusLabel: string;
  posts: { title: string; url: string }[];
  // Set when the update comes with a changelog announcement.
  announcement?: { title: string; url: string };
  unsubscribeUrl: string;
};

// The email a voter gets when ideas they voted for change status. One email per person, even
// when several of their ideas changed at once.
export function buildUpdateEmail(input: UpdateEmailInput) {
  const { organizationName, recipientName, statusLabel, posts, announcement, unsubscribeUrl } =
    input;
  const single = posts.length === 1;
  const subject = single
    ? `${statusLabel}: ${posts[0].title}`
    : `${posts.length} ideas you voted for are now ${statusLabel.toLowerCase()}`;
  const greeting = `Hi ${recipientName ?? "there"},`;
  const intro = single
    ? `${organizationName} marked an idea you voted for as ${statusLabel}:`
    : `${organizationName} marked ${posts.length} ideas you voted for as ${statusLabel}:`;
  const footer = `You're getting this because you voted on ${organizationName}'s feedback board.`;

  const text = [
    greeting,
    "",
    intro,
    ...posts.map((post) => `- ${post.title}: ${post.url}`),
    ...(announcement
      ? ["", `Read the announcement, "${announcement.title}": ${announcement.url}`]
      : []),
    "",
    footer,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  const link = (url: string, label: string) =>
    `<a href="${escapeHtml(url)}" style="color:#2563eb;">${escapeHtml(label)}</a>`;
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#374151;">${escapeHtml(intro)}</p>
      <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.6;">
        ${posts.map((post) => `<li>${link(post.url, post.title)}</li>`).join("\n        ")}
      </ul>
      ${announcement ? `<p style="margin:0 0 20px;font-size:15px;">Read the announcement: ${link(announcement.url, announcement.title)}</p>` : ""}
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">${escapeHtml(footer)} ${link(unsubscribeUrl, "Unsubscribe")}</p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
