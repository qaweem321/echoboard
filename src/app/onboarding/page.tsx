import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { CreateOrganizationForm } from "./create-organization-form";

export const metadata: Metadata = { title: "Create organization" };

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Create your organization</h1>
        <p className="text-muted-foreground">
          Hi {user.name}! An organization is your team&apos;s workspace. You can invite teammates
          later.
        </p>
        <CreateOrganizationForm />
      </div>
    </main>
  );
}
