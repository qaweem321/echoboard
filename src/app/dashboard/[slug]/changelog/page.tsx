import type { Metadata } from "next";
import Link from "next/link";
import { Pager } from "@/components/pager";
import { listEntries } from "@/lib/changelog/queries";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/session";
import { buildHref, parsePage, type RawSearchParams } from "@/lib/url-params";
import { NewEntryForm } from "./new-entry-form";

export const metadata: Metadata = { title: "Changelog" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export default async function ChangelogPage({ params, searchParams }: Props) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const { organization, role } = await requireMembership(slug);
  const page = parsePage(rawSearch.page);
  const { entries, hasMore } = await listEntries(organization.id, false, page);
  const canManage = can(role, "changelog:manage");
  const base = `/dashboard/${slug}/changelog`;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Changelog</h1>
      <p className="mt-1 text-muted-foreground">
        Announce what shipped. Publishing can mark the linked ideas Complete and email everyone who
        voted for them.
      </p>

      {canManage && <NewEntryForm slug={slug} />}

      {entries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">No entries yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? "Start a draft with the form above."
              : "An owner or admin can write the first entry."}
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-xl border border-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                {canManage ? (
                  <Link href={`${base}/${entry.id}`} className="font-medium hover:underline">
                    {entry.title}
                  </Link>
                ) : (
                  <p className="font-medium">{entry.title}</p>
                )}
                <p className="mt-1 text-xs text-subtle-foreground">
                  {entry.publishedAt
                    ? `Published ${formatDate(entry.publishedAt)}`
                    : `Draft, started ${formatDate(entry.createdAt)}`}
                  {entry.posts.length > 0 &&
                    ` · ${entry.posts.length} linked ${entry.posts.length === 1 ? "idea" : "ideas"}`}
                </p>
              </div>
              {!entry.publishedAt && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Draft
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pager
        previousHref={page > 1 ? buildHref(base, { page: page - 1 }, { page: 1 }) : null}
        nextHref={hasMore ? buildHref(base, { page: page + 1 }) : null}
      />
    </div>
  );
}
