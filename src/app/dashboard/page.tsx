import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LAST_ORGANIZATION_COOKIE, pickOrganization } from "@/lib/last-organization";
import { getUserOrganizations, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Choose an organization" };

// After login: open the last-used (or only) organization, or let the user choose.
export default async function DashboardIndexPage() {
  const user = await requireUser();
  const [organizations, cookieStore] = await Promise.all([
    getUserOrganizations(user.id),
    cookies(),
  ]);

  if (organizations.length === 0) {
    redirect("/onboarding");
  }
  const organization = pickOrganization(
    organizations,
    cookieStore.get(LAST_ORGANIZATION_COOKIE)?.value,
  );
  if (organization) {
    redirect(`/dashboard/${organization.slug}`);
  }

  // Several organizations and none used yet on this device: ask which one.
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">Choose an organization</h1>
        <p className="mt-1 text-muted-foreground">
          Hi {user.name}! You belong to {organizations.length} organizations.
        </p>
        <ul className="mt-6 divide-y divide-border rounded-xl border border-border">
          {organizations.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/dashboard/${item.slug}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-sm capitalize text-subtle-foreground">{item.role}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/onboarding" className="mt-4 inline-block text-sm text-link hover:underline">
          + Create a new organization
        </Link>
      </div>
    </main>
  );
}
