import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { CreateOrganizationForm } from "./create-organization-form";

export const metadata: Metadata = { title: "Create workspace" };

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Create your workspace</h1>
        <p className="text-muted-foreground">
          Hi {user.name}! A workspace is where your team collects and manages feedback. You can
          invite teammates later.
        </p>
        <CreateOrganizationForm />
      </div>
    </main>
  );
}
