import { findSimilarPosts } from "@/lib/feedback/similar";
import { findPortal } from "@/lib/portal/queries";
import { SEARCH_MAX } from "@/lib/portal-params";
import { withinSearchLimit } from "@/lib/search-limit";

// Ideas similar to a title someone is typing (portal and widget "Share an idea" forms).
export async function GET(request: Request, { params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  // Independent, so they run together: the limit adds no wait.
  const [portal, allowed] = await Promise.all([
    findPortal(org),
    withinSearchLimit(request.headers, org),
  ]);
  if (!portal) {
    return Response.json({ error: "Workspace not found." }, { status: 404 });
  }
  if (!allowed) {
    return Response.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }
  const text = (new URL(request.url).searchParams.get("q") ?? "").slice(0, SEARCH_MAX);
  const posts = await findSimilarPosts(portal.organization.id, text);
  return Response.json({ posts }, { headers: { "Cache-Control": "private, no-store" } });
}
