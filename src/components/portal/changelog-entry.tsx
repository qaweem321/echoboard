import Link from "next/link";
import type { ChangelogEntry as Entry } from "@/lib/changelog/queries";
import { formatDate } from "@/lib/format";

// base: "/p/acme", or "" on the workspace's own domain.
type Props = { base: string; entry: Entry; titleAsLink?: boolean };

// One published changelog entry: date, title, text and the ideas it shipped.
export function ChangelogEntry({ base, entry, titleAsLink = false }: Props) {
  return (
    <article className="space-y-3">
      {entry.publishedAt && (
        <p className="text-sm text-subtle-foreground">{formatDate(entry.publishedAt)}</p>
      )}
      <h2 className="text-xl font-bold break-words">
        {titleAsLink ? (
          <Link href={`${base}/changelog/${entry.id}`} className="hover:underline">
            {entry.title}
          </Link>
        ) : (
          entry.title
        )}
      </h2>
      {entry.body && (
        <p className="whitespace-pre-wrap break-words text-secondary-foreground">{entry.body}</p>
      )}
      {entry.posts.length > 0 && (
        <div className="rounded-lg bg-surface p-3">
          <p className="text-sm font-medium">Ideas shipped</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {entry.posts.map((post) => (
              <li key={post.id}>
                <Link href={`${base}/posts/${post.id}`} className="text-link hover:underline">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
