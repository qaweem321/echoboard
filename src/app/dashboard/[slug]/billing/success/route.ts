import { redirect } from "next/navigation";
import { syncSubscription } from "@/lib/billing";
import { requireMembership } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization } = await requireMembership(slug);

  await syncSubscription(organization.id);
  redirect(`/dashboard/${slug}/billing`);
}
