import type { Metadata } from "next";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/session";
import { DangerZone } from "./danger-zone";
import { RenameForm } from "./rename-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization, role } = await requireMembership(slug);
  const canEdit = can(role, "organization:update");

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-muted-foreground">
        Manage your organization. Personal settings are under Account.
      </p>

      <RenameForm slug={slug} name={organization.name} canEdit={canEdit} />

      <DangerZone
        slug={slug}
        organizationName={organization.name}
        canDelete={can(role, "organization:delete")}
      />
    </div>
  );
}
