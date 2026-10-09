import { publicPortalUrl } from "@/lib/portal/links";
import type { PostStatus } from "@/lib/post-status";
import type { PostRef } from "./events";

type Organization = { slug: string; customDomain: string | null };

// A post as webhooks describe it, with a link people can open.
export function postRef(
  organization: Organization,
  post: { id: string; title: string; status: PostStatus },
): PostRef {
  return { ...post, url: publicPortalUrl(organization, `/posts/${post.id}`) };
}

export function changelogRef(organization: Organization, entry: { id: string; title: string }) {
  return { ...entry, url: publicPortalUrl(organization, `/changelog/${entry.id}`) };
}
