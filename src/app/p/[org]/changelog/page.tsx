import type { Metadata } from "next";
import { Pager } from "@/components/pager";
import { ChangelogEntry } from "@/components/portal/changelog-entry";
import { listEntries } from "@/lib/changelog/queries";
import { endSentence } from "@/lib/format";
import { getPortal } from "@/lib/portal/queries";
import { buildHref, parsePage, type RawSearchParams } from "@/lib/url-params";

export const metadata: Metadata = { title: "Changelog" };

type Props = { params: Promise<{ org: string }>; searchParams: Promise<RawSearchParams> };

export default async function PortalChangelogPage({ params, searchParams }: Props) {
  const [{ org }, rawSearch] = await Promise.all([params, searchParams]);
  const { organization } = await getPortal(org);
  const page = parsePage(rawSearch.page);
  const { entries, hasMore } = await listEntries(organization.id, true, page);
  const base = `/p/${organization.slug}/changelog`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Changelog</h1>
        <p className="mt-1 text-muted-foreground">
          What&apos;s new in {endSentence(organization.name)}
        </p>
      </div>
      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">No updates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="py-8 first:pt-0">
              <ChangelogEntry organizationSlug={organization.slug} entry={entry} titleAsLink />
            </div>
          ))}
        </div>
      )}
      <Pager
        previousHref={page > 1 ? buildHref(base, { page: page - 1 }, { page: 1 }) : null}
        nextHref={hasMore ? buildHref(base, { page: page + 1 }) : null}
      />
    </div>
  );
}
