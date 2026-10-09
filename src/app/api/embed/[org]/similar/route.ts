import { findSimilarPosts } from "@/lib/feedback/similar";
import { findPortal } from "@/lib/portal/queries";
import { SEARCH_MAX } from "@/lib/portal-params";

// Ideas similar to a title someone is typing (portal and widget "Share an idea" forms).
export async function GET(request: Request, { params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const portal = await findPortal(org);
  if (!portal) {
    return Response.json({ error: "Workspace not found." }, { status: 404 });
  }
  const text = (new URL(request.url).searchParams.get("q") ?? "").slice(0, SEARCH_MAX);
  const posts = await findSimilarPosts(portal.organization.id, text);
  return Response.json({ posts }, { headers: { "Cache-Control": "private, no-store" } });
}
