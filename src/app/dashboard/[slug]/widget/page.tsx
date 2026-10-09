import type { Metadata } from "next";
import { CodeSnippet } from "@/components/code-snippet";
import { absoluteUrl } from "@/config/site";
import { requireMembership } from "@/lib/session";

export const metadata: Metadata = { title: "Widget" };

export default async function WidgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization } = await requireMembership(slug);
  // The button uses the workspace's brand color (set under Branding) when there is one.
  const color = organization.brandColor ? ` data-color="${organization.brandColor}"` : "";
  const script = `<script src="${absoluteUrl("/widget.js")}" data-workspace="${organization.slug}"${color} async></script>`;
  const ownButton = `<a href="#" onclick="FeedbackWidget.open(); return false;">Send feedback</a>`;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Widget</h1>
        <p className="mt-1 text-muted-foreground">
          Collect feedback inside your own website or app. Visitors vote and share ideas without
          leaving the page or creating an account.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">1. Add this line to your website</h2>
        <p className="text-sm text-muted-foreground">
          Paste it before <code>&lt;/body&gt;</code> on every page where the Feedback button should
          appear.
        </p>
        <CodeSnippet code={script} label="Widget code" />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">2. Adjust it (optional)</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <code>data-label=&quot;Ideas&quot;</code>: the button text (default
            &ldquo;Feedback&rdquo;).
          </li>
          <li>
            <code>data-position=&quot;left&quot;</code>: show the button in the bottom-left corner.
          </li>
          <li>
            <code>data-color=&quot;#16a34a&quot;</code>: the button color.
          </li>
          <li>
            <code>data-button=&quot;false&quot;</code>: no floating button. Open the panel from your
            own link instead:
          </li>
        </ul>
        <CodeSnippet code={ownButton} label="Your own button" />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Preview</h2>
        <p className="text-sm text-muted-foreground">
          See the panel your visitors get:{" "}
          <a
            href={`/embed/${organization.slug}`}
            target="_blank"
            rel="noopener"
            className="text-link hover:underline"
          >
            open the widget panel ↗
          </a>
        </p>
      </section>
    </div>
  );
}
