import Link from "next/link";
import { ChangelogEntry } from "@/components/portal/changelog-entry";
import { getEntry } from "@/lib/changelog/queries";
import { getPortal } from "@/lib/portal/queries";

type Props = { params: Promise<{ org: string; entryId: string }> };

async function load({ params }: Props) {
  const { org, entryId } = await params;
  const { organization } = await getPortal(org);
  return { organization, entry: await getEntry(organization.id, entryId, true) };
}

export async function generateMetadata(props: Props) {
  const { entry } = await load(props);
  return { title: entry.title };
}

// One entry's own page: the link in "it shipped" emails.
export default async function PortalChangelogEntryPage(props: Props) {
  const { organization, entry } = await load(props);
  return (
    <div className="space-y-6">
      <Link
        href={`/p/${organization.slug}/changelog`}
        className="text-sm text-link hover:underline"
      >
        ← Changelog
      </Link>
      <ChangelogEntry organizationSlug={organization.slug} entry={entry} />
    </div>
  );
}
