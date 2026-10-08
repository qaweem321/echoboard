import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/portal/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getInboxPost } from "@/lib/feedback/inbox";
import { formatDate } from "@/lib/format";
import { countReachableVoters } from "@/lib/notifications/voter-updates";
import { can } from "@/lib/permissions";
import { getPortal } from "@/lib/portal/queries";
import { requireMembership } from "@/lib/session";
import { deleteComment, deletePost } from "../actions";
import { EditPostForm } from "./edit-form";
import { MergeForm } from "./merge-form";

export const metadata: Metadata = { title: "Feedback post" };

type Props = { params: Promise<{ slug: string; postId: string }> };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function FeedbackPostPage({ params }: Props) {
  const { slug, postId } = await params;
  const [{ organization, role }, { boards }] = await Promise.all([
    requireMembership(slug),
    getPortal(slug),
  ]);
  const [{ post, comments, namedVoters, mergeTargets }, reachableVoters] = await Promise.all([
    getInboxPost(organization.id, postId),
    countReachableVoters(organization.id, postId),
  ]);
  const base = `/dashboard/${slug}/feedback`;

  // A merged duplicate has nothing left to manage: show the main post.
  if (post.mergedIntoId) {
    redirect(`${base}/${post.mergedIntoId}`);
  }
  const canDelete = can(role, "feedback:delete");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={base} className="text-sm text-link hover:underline">
          ← All feedback
        </Link>
        <h1 className="mt-2 text-2xl font-bold break-words">{post.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-subtle-foreground">
          <StatusBadge status={post.status} />
          <span>
            {post.voteCount} {post.voteCount === 1 ? "vote" : "votes"}
          </span>
          <span>
            · by {post.authorName ?? "Anonymous"}
            {post.authorEmail && ` (${post.authorEmail})`} · {formatDate(post.createdAt)}
          </span>
          <a
            href={`/p/${slug}/posts/${post.id}`}
            target="_blank"
            rel="noopener"
            className="text-link hover:underline"
          >
            View on portal ↗
          </a>
        </div>
      </div>

      <Section title="Status and details">
        <EditPostForm slug={slug} post={post} boards={boards} reachableVoters={reachableVoters} />
      </Section>

      <Section title={`Comments (${comments.length})`}>
        {comments.length === 0 ? (
          <p className="text-sm text-subtle-foreground">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-lg bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-subtle-foreground">
                    <span className="font-medium text-foreground">
                      {comment.authorName ?? "Anonymous"}
                    </span>
                    {comment.byTeam && " (team)"} · {formatDate(comment.createdAt)}
                  </p>
                  {canDelete && (
                    <form action={deleteComment}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="postId" value={post.id} />
                      <input type="hidden" name="commentId" value={comment.id} />
                      <SubmitButton
                        variant="danger-link"
                        size="inline"
                        pendingText="Deleting..."
                        confirm="Delete this comment? This cannot be undone."
                        aria-label="Delete comment"
                      >
                        Delete
                      </SubmitButton>
                    </form>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          To reply, comment on the{" "}
          <a href={`/p/${slug}/posts/${post.id}`} className="text-link hover:underline">
            portal page
          </a>
          ; your comment is marked &ldquo;Team&rdquo;.
        </p>
      </Section>

      <Section title={`Voters who left their details (${namedVoters.length})`}>
        {namedVoters.length === 0 ? (
          <p className="text-sm text-subtle-foreground">
            Nobody who voted left a name or email yet. Anonymous votes still count.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {namedVoters.map((voter) => (
              <li key={voter.id}>
                {voter.name ?? "No name"}
                {voter.email && <span className="text-subtle-foreground"> · {voter.email}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Merge a duplicate">
        <p className="mb-3 text-sm text-muted-foreground">
          Is this the same idea as another post? Merge it: votes and comments move to the main post,
          and nobody&apos;s vote counts twice.
        </p>
        <MergeForm slug={slug} postId={post.id} targets={mergeTargets} />
      </Section>

      {canDelete && (
        <Section title="Delete post">
          <p className="mb-3 text-sm text-muted-foreground">
            Removes the post with its votes and comments. To decline an idea but keep it, set the
            status to Closed instead.
          </p>
          <form action={deletePost}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="postId" value={post.id} />
            <SubmitButton
              variant="danger-outline"
              pendingText="Deleting..."
              confirm={`Delete "${post.title}"? This cannot be undone.`}
            >
              Delete post
            </SubmitButton>
          </form>
        </Section>
      )}
    </div>
  );
}
