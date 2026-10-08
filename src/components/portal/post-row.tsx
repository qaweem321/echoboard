import Link from "next/link";
import type { PortalPost } from "@/lib/portal/queries";
import { StatusBadge } from "./status-badge";
import { VoteButton } from "./vote-button";

type Props = { organizationSlug: string; post: PortalPost; showBoard: boolean };

export function PostRow({ organizationSlug, post, showBoard }: Props) {
  return (
    <li className="flex gap-4 p-4">
      <VoteButton
        organizationSlug={organizationSlug}
        postId={post.id}
        voted={post.voted}
        count={post.voteCount}
        title={post.title}
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/p/${organizationSlug}/posts/${post.id}`}
          className="font-medium hover:underline"
        >
          {post.title}
        </Link>
        {post.body && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-subtle-foreground">
          {post.status !== "open" && <StatusBadge status={post.status} />}
          {showBoard && <span>{post.boardName}</span>}
          <span>
            {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          </span>
        </div>
      </div>
    </li>
  );
}
