import type { Metadata } from "next";
import { brandStyle } from "@/components/portal/brand-style";
import { getPortal } from "@/lib/portal/queries";
import { EmbedApp } from "./embed-app";

export const metadata: Metadata = { title: "Feedback", robots: { index: false } };

// The panel the widget opens inside other websites (see public/widget.js). It can also be
// opened on its own for testing.
export default async function EmbedPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { organization, boards } = await getPortal(org);
  return (
    <div style={brandStyle(organization.brandColor)}>
      <EmbedApp
        organization={{ slug: organization.slug, name: organization.name }}
        boards={boards.map((board) => ({ id: board.id, name: board.name }))}
      />
    </div>
  );
}
