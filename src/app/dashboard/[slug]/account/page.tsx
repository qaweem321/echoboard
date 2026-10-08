import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeSelect } from "@/components/theme";
import { planAccountDeletion } from "@/lib/account";
import { requireMembership } from "@/lib/session";
import { DeleteAccountForm } from "./delete-account-form";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await requireMembership(slug);
  const deletion = await planAccountDeletion(user.id);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Account</h1>
      <p className="mt-1 text-muted-foreground">
        Your personal settings. These apply in every organization.
      </p>

      <Section title="Profile" description={`Signed in as ${user.email}.`}>
        <ProfileForm name={user.name} />
      </Section>

      <Section
        title="Password"
        description="Changing your password logs you out on your other devices."
      >
        <PasswordForm />
      </Section>

      <Section
        title="Appearance"
        description={`Saved on this device. "System" follows your device's light or dark setting.`}
      >
        <label htmlFor="theme" className="block text-sm font-medium">
          Theme
        </label>
        <ThemeSelect />
      </Section>

      <Section
        title="Delete account"
        description="Permanently deletes your account and removes you from every organization."
      >
        {deletion.blockers.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {deletion.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        ) : (
          <>
            {deletion.soloOrganizations.length > 0 && (
              <p className="text-sm text-muted-foreground">
                This also deletes{" "}
                {deletion.soloOrganizations.map((organization) => organization.name).join(", ")},
                since you&apos;re the only member.
              </p>
            )}
            <DeleteAccountForm />
          </>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-border pt-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
