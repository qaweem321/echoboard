import type { Metadata } from "next";
import { firstParam, type RawSearchParams } from "@/lib/url-params";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

// Asks for a click instead of unsubscribing on page load: email scanners open links
// automatically, and that must not unsubscribe anyone.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const voterId = firstParam(params.v) ?? "";
  const token = firstParam(params.t) ?? "";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Unsubscribe from updates</h1>
        <p className="text-muted-foreground">
          Stop getting emails when ideas you voted for change status.
        </p>
        <UnsubscribeForm voterId={voterId} token={token} />
      </div>
    </main>
  );
}
