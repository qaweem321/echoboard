import type { Metadata } from "next";
import Link from "next/link";
import { Pager } from "@/components/pager";
import { StatusBadge } from "@/components/portal/status-badge";
import { buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { listInboxPosts } from "@/lib/feedback/inbox";
import { formatDate } from "@/lib/format";
import { inboxHref, inboxSorts, parseInboxParams } from "@/lib/inbox-params";
import { getPortal } from "@/lib/portal/queries";
import { SEARCH_MAX } from "@/lib/portal-params";
import { postStatuses, postStatusLabels } from "@/lib/post-status";
import { requireMembership } from "@/lib/session";
import type { RawSearchParams } from "@/lib/url-params";

export const metadata: Metadata = { title: "Feedback" };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export default async function FeedbackInboxPage({ params, searchParams }: Props) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const [{ organization }, { boards }] = await Promise.all([
    requireMembership(slug),
    getPortal(slug),
  ]);
  const options = parseInboxParams(rawSearch);
  const board = boards.find((candidate) => candidate.slug === options.board) ?? null;
  const current = { ...options, board: board?.slug ?? null };
  const base = `/dashboard/${slug}/feedback`;

  const { posts, hasMore } = await listInboxPosts(organization.id, board?.id ?? null, current);
  const filtered = Boolean(current.status || current.board || current.q);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">Feedback</h1>
      <p className="mt-1 text-muted-foreground">
        Everything people shared on your portal. Open a post to change its status, edit it or merge
        a duplicate.
      </p>

      {/* A plain GET form: filters live in the URL, so a filtered view can be bookmarked. */}
      <form action={base} className="mt-6 flex flex-wrap gap-2">
        <Select name="status" defaultValue={current.status ?? ""} aria-label="Status">
          <option value="">All statuses</option>
          {postStatuses.map((status) => (
            <option key={status} value={status}>
              {postStatusLabels[status]}
            </option>
          ))}
        </Select>
        {boards.length > 1 && (
          <Select name="board" defaultValue={current.board ?? ""} aria-label="Board">
            <option value="">All boards</option>
            {boards.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </Select>
        )}
        <Select name="sort" defaultValue={current.sort} aria-label="Sort">
          {Object.entries(inboxSorts).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {/* The wrapper sets the width: Input itself is full width. */}
        <div className="w-48">
          <Input
            type="search"
            name="q"
            defaultValue={current.q}
            maxLength={SEARCH_MAX}
            placeholder="Search"
          />
        </div>
        <button type="submit" className={buttonClasses({ variant: "outline" })}>
          Apply
        </button>
        {filtered && (
          <Link href={base} className={buttonClasses({ variant: "link", size: "inline" })}>
            Clear
          </Link>
        )}
      </form>

      {posts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">{filtered ? "No matching feedback" : "No feedback yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered ? (
              "Try other filters."
            ) : (
              <>
                Share your{" "}
                <a href={`/p/${slug}`} className="text-link hover:underline">
                  public portal
                </a>{" "}
                with customers to start collecting ideas.
              </>
            )}
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-xl border border-border">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-4 p-4">
              <div className="w-12 shrink-0 text-center">
                <p className="text-lg font-semibold">{post.voteCount}</p>
                <p className="text-xs text-subtle-foreground">
                  {post.voteCount === 1 ? "vote" : "votes"}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`${base}/${post.id}`} className="font-medium hover:underline">
                  {post.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle-foreground">
                  <StatusBadge status={post.status} />
                  <span>{post.boardName}</span>
                  <span>
                    {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager
        previousHref={
          current.page > 1 ? inboxHref(base, current, { page: current.page - 1 }) : null
        }
        nextHref={hasMore ? inboxHref(base, current, { page: current.page + 1 }) : null}
      />
    </div>
  );
}
