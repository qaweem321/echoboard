import { headers } from "next/headers";
import Link from "next/link";
import { Pager } from "@/components/pager";
import { PostRow } from "@/components/portal/post-row";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { portalBase } from "@/lib/portal/links";
import { getPortal, listPortalPosts } from "@/lib/portal/queries";
import { currentVoterHash } from "@/lib/portal/voter";
import { parsePortalParams, portalHref, portalSorts, SEARCH_MAX } from "@/lib/portal-params";
import { withinSearchLimit } from "@/lib/search-limit";
import { PostForm } from "./post-form";

type Props = {
  params: Promise<{ org: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PortalHomePage({ params, searchParams }: Props) {
  const [{ org }, rawSearch] = await Promise.all([params, searchParams]);
  const { organization, boards } = await getPortal(org);
  const options = parsePortalParams(rawSearch);
  const board = boards.find((candidate) => candidate.slug === options.board) ?? null;
  // Links in this page: "/p/acme" here, or "/" on the workspace's own domain.
  const base = (await portalBase(organization.slug)) || "/";

  if (boards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="font-medium">Nothing here yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {organization.name} hasn&apos;t opened any feedback boards yet.
        </p>
      </div>
    );
  }

  // Searching runs a text search, so it's limited per visitor like the widget's search.
  const searchBlocked =
    Boolean(options.q) && !(await withinSearchLimit(await headers(), organization.slug));
  const { posts, hasMore } = searchBlocked
    ? { posts: [], hasMore: false }
    : await listPortalPosts(
        organization.id,
        board?.id ?? null,
        options,
        await currentVoterHash(organization.id),
      );
  const current = { ...options, board: board?.slug ?? null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{board?.name ?? "All feedback"}</h1>
        <p className="mt-1 text-muted-foreground">
          {board?.description ??
            `Tell ${organization.name} what you need, and vote for the ideas you want most.`}
        </p>
      </div>

      <details className="rounded-xl border border-border p-4" open={posts.length === 0}>
        <summary className="cursor-pointer font-medium text-link">Share an idea</summary>
        <div className="mt-4">
          <PostForm
            organizationSlug={organization.slug}
            boards={boards}
            defaultBoardId={board?.id}
            base={base === "/" ? "" : base}
          />
        </div>
      </details>

      {boards.length > 1 && (
        <nav aria-label="Boards" className="flex flex-wrap gap-2">
          {[{ slug: null, name: "All" }, ...boards].map((item) => (
            <Link
              key={item.slug ?? "all"}
              href={portalHref(base, current, { board: item.slug, page: 1 })}
              aria-current={item.slug === current.board ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                item.slug === current.board
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 text-sm" aria-label="Sort">
          {Object.entries(portalSorts).map(([sort, label]) => (
            <Link
              key={sort}
              href={portalHref(base, current, { sort: sort as keyof typeof portalSorts, page: 1 })}
              aria-current={sort === current.sort ? "true" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5",
                sort === current.sort
                  ? "bg-accent font-medium"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <form action={base} className="flex gap-2">
          {current.board && <input type="hidden" name="board" value={current.board} />}
          {current.sort !== "top" && <input type="hidden" name="sort" value={current.sort} />}
          <Input
            type="search"
            name="q"
            defaultValue={current.q}
            maxLength={SEARCH_MAX}
            placeholder="Search feedback"
            className="w-56"
          />
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">
            {searchBlocked
              ? "Too many searches just now"
              : current.q
                ? "No matching feedback"
                : "No feedback yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchBlocked
              ? "Please wait a minute, then search again."
              : current.q
                ? "Try other words, or share it as a new idea."
                : "Be the first to share an idea."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {posts.map((post) => (
            <PostRow
              key={post.id}
              organizationSlug={organization.slug}
              base={base === "/" ? "" : base}
              post={post}
              showBoard={!board && boards.length > 1}
            />
          ))}
        </ul>
      )}

      <Pager
        previousHref={
          current.page > 1 ? portalHref(base, current, { page: current.page - 1 }) : null
        }
        nextHref={hasMore ? portalHref(base, current, { page: current.page + 1 }) : null}
      />
    </div>
  );
}
