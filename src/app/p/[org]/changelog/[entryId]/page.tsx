import Link from "next/link";
import { ChangelogEntry } from "@/components/portal/changelog-entry";
import { getEntry } from "@/lib/changelog/queries";
import { portalBase } from "@/lib/portal/links";
import { getPortal } from "@/lib/portal/queries";

type Props = { params: Promise<{ org: string; entryId: string }> };

async function load({ params }: Props) {
  const { org, entryId } = await params;
  const { organization } = await getPortal(org);
  const [entry, base] = await Promise.all([
    getEntry(organization.id, entryId, true),
    portalBase(organization.slug),
  ]);
  return { entry, base };
}

export async function generateMetadata(props: Props) {
  const { entry } = await load(props);
  return { title: entry.title };
}

// One entry's own page: the link in "it shipped" emails.
export default async function PortalChangelogEntryPage(props: Props) {
  const { entry, base } = await load(props);
  return (
    <div className="space-y-6">
      <Link href={`${base}/changelog`} className="text-sm text-link hover:underline">
        ← Changelog
      </Link>
      <ChangelogEntry base={base} entry={entry} />
    </div>
  );
}
