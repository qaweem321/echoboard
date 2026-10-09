import Link from "next/link";
import { CodeSnippet } from "@/components/code-snippet";
import { publicPortalUrl } from "@/lib/portal/links";

type Props = { slug: string; organization: { slug: string; customDomain: string | null } };

// Shown on the Overview until the first feedback arrives: the three steps to start collecting.
export function GetStarted({ slug, organization }: Props) {
  const base = `/dashboard/${slug}`;
  return (
    <section className="mt-8 rounded-xl border border-border p-5">
      <h2 className="font-semibold">Get started</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your public feedback portal is ready. Three steps to your first ideas:
      </p>
      <ol className="mt-4 space-y-4 text-sm">
        <li>
          <p className="font-medium">1. Share your portal link with your customers</p>
          <div className="mt-2 max-w-xl">
            <CodeSnippet
              code={publicPortalUrl(organization)}
              label="Portal link"
              copyLabel="Copy link"
            />
          </div>
        </li>
        <li>
          <p className="font-medium">2. Add the feedback button to your website or app</p>
          <Link href={`${base}/widget`} className="text-link hover:underline">
            Get the widget code
          </Link>
        </li>
        <li>
          <p className="font-medium">3. Make it look like your product</p>
          <Link href={`${base}/branding`} className="text-link hover:underline">
            Set your logo and colors
          </Link>
        </li>
      </ol>
    </section>
  );
}
