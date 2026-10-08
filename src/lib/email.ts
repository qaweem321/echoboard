import { siteConfig } from "@/config/site";
import { isDemoMode } from "@/lib/demo";

type Email = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: Email) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || isDemoMode()) {
    console.log(
      `\n--- Email (${apiKey ? "demo" : "dev"} mode, not sent) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n---------------------------------\n`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${siteConfig.name} <onboarding@resend.dev>`,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sending email failed: ${response.status} ${await response.text()}`);
  }
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type ButtonEmail = {
  heading: string;
  message: string;
  buttonText: string;
  url: string;
  footer: string;
};

export function buttonEmailHtml({ heading, message, buttonText, url, footer }: ButtonEmail) {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#374151;">${escapeHtml(message)}</p>
      <a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;">${escapeHtml(buttonText)}</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">If the button doesn't work, open this link:<br><a href="${safeUrl}" style="color:#2563eb;word-break:break-all;">${safeUrl}</a></p>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(footer)}</p>
    </div>
  </body>
</html>`;
}
