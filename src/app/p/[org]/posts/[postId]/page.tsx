import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/portal/status-badge";
import { VoteButton } from "@/components/portal/vote-button";
import { formatDate } from "@/lib/format";
import { portalBase } from "@/lib/portal/links";
import { getPortal, getPortalPost, getTeamViewer } from "@/lib/portal/queries";
import { currentVoterHash } from "@/lib/portal/voter";
import { CommentForm } from "../../comment-form";

type Props = { params: Promise<{ org: string; postId: string }> };

function AuthorName({ name, byTeam }: { name: string | null; byTeam: boolean }) {
  return (
    <span className="font-medium text-foreground">
      {name ?? "Anonymous"}
      {byTeam && (
        <span className="ml-1.5 rounded bg-link/10 px-1.5 py-0.5 text-xs font-medium text-link">
          Team
        </span>
      )}
    </span>
  );
}

export async function generateMetadata({ params }: Props) {
  const { org, postId } = await params;
  const { organization } = await getPortal(org);
  const { post } = await getPortalPost(organization.id, postId, null);
  return { title: post.title };
}

export default async function PortalPostPage({ params }: Props) {
  const { org, postId } = await params;
  const { organization } = await getPortal(org);
  const [{ post, comments }, teamViewer] = await Promise.all([
    getPortalPost(organization.id, postId, await currentVoterHash(organization.id)),
    getTeamViewer(organization.id),
  ]);
  const base = await portalBase(organization.slug);

  // Duplicates send visitors to the post they were merged into.
  if (post.mergedIntoId) {
    redirect(`${base}/posts/${post.mergedIntoId}`);
  }

  return (
    <article className="space-y-8">
      <Link
        href={`${base || "/"}?board=${post.board.slug}`}
        className="text-sm text-link hover:underline"
      >
        ← {post.board.name}
      </Link>

      <div className="flex gap-4">
        <VoteButton
          organizationSlug={organization.slug}
          postId={post.id}
          voted={post.voted}
          count={post.voteCount}
          title={post.title}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold break-words">{post.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-subtle-foreground">
            <StatusBadge status={post.status} />
            <AuthorName name={post.authorName} byTeam={post.byTeam} />
            <span>· {formatDate(post.createdAt)}</span>
          </div>
          {post.body && (
            <p className="mt-4 whitespace-pre-wrap break-words text-secondary-foreground">
              {post.body}
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="comments-heading" className="space-y-4">
        <h2 id="comments-heading" className="font-semibold">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>
        {comments.length > 0 && (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border border-border p-4">
                <p className="text-sm text-subtle-foreground">
                  <AuthorName name={comment.authorName} byTeam={comment.byTeam} /> ·{" "}
                  {formatDate(comment.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}
        <CommentForm organizationSlug={organization.slug} postId={post.id} isTeam={!!teamViewer} />
      </section>
    </article>
  );
}
