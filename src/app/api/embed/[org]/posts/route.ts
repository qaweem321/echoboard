import { EMBED_TOKEN_HEADER } from "@/lib/embed";
import { findPortal, listPortalPosts } from "@/lib/portal/queries";
import { voterHash } from "@/lib/portal/voter";
import { parsePortalParams } from "@/lib/portal-params";
import { withinSearchLimit } from "@/lib/search-limit";

// Ideas for the embeddable widget, with the visitor's votes. The widget runs inside other
// websites, where cookies are often blocked, so it identifies the visitor with a token header.
export async function GET(request: Request, { params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  // Independent, so they run together: the limit adds no wait.
  const [portal, allowed] = await Promise.all([findPortal(org), withinSearchLimit(request, org)]);
  if (!portal) {
    return Response.json({ error: "Workspace not found." }, { status: 404 });
  }
  if (!allowed) {
    return Response.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }
  const url = new URL(request.url);
  const options = parsePortalParams(Object.fromEntries(url.searchParams));
  const result = await listPortalPosts(
    portal.organization.id,
    null,
    options,
    voterHash(portal.organization.id, request.headers.get(EMBED_TOKEN_HEADER)),
  );
  return Response.json(
    {
      posts: result.posts.map((post) => ({
        id: post.id,
        title: post.title,
        status: post.status,
        voteCount: post.voteCount,
        commentCount: post.commentCount,
        voted: post.voted,
      })),
      hasMore: result.hasMore,
    },
    // Votes differ per visitor, so nothing may be cached.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
