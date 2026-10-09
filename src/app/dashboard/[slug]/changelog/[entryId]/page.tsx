import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { getEntry, listLinkablePosts } from "@/lib/changelog/queries";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { deleteEntry, unpublishEntry } from "../actions";
import { EntryForm } from "./entry-form";

export const metadata: Metadata = { title: "Changelog entry" };

type Props = { params: Promise<{ slug: string; entryId: string }> };

export default async function ChangelogEntryPage({ params }: Props) {
  const { slug, entryId } = await params;
  const { organization } = await requirePermission(slug, "changelog:manage");
  const [entry, roadmapPosts] = await Promise.all([
    getEntry(organization.id, entryId, false),
    listLinkablePosts(organization.id),
  ]);
  // Keep linked ideas that were closed since, so saving doesn't drop them.
  const listed = new Set(roadmapPosts.map((post) => post.id));
  const linkablePosts = [...entry.posts.filter((post) => !listed.has(post.id)), ...roadmapPosts];
  const base = `/dashboard/${slug}/changelog`;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={base} className="text-sm text-link hover:underline">
          ← Changelog
        </Link>
        <p className="mt-2 text-sm text-subtle-foreground">
          {entry.publishedAt ? (
            <>
              Published {formatDate(entry.publishedAt)} ·{" "}
              <a
                href={`/p/${slug}/changelog/${entry.id}`}
                target="_blank"
                rel="noopener"
                className="text-link hover:underline"
              >
                View on portal ↗
              </a>
            </>
          ) : (
            "Draft: only your team can see it."
          )}
        </p>
      </div>

      <EntryForm slug={slug} entry={entry} linkablePosts={linkablePosts} />

      <div className="flex flex-wrap gap-4 border-t border-border pt-6">
        {entry.publishedAt && (
          <form action={unpublishEntry}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="entryId" value={entry.id} />
            <SubmitButton
              variant="outline"
              pendingText="Unpublishing..."
              confirm="Unpublish this entry? It disappears from your public changelog."
            >
              Unpublish
            </SubmitButton>
          </form>
        )}
        <form action={deleteEntry}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="entryId" value={entry.id} />
          <SubmitButton
            variant="danger-outline"
            pendingText="Deleting..."
            confirm={`Delete "${entry.title}"? This cannot be undone.`}
          >
            Delete entry
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
