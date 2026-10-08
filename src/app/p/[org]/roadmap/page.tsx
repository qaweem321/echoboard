import type { Metadata } from "next";
import Link from "next/link";
import { VoteButton } from "@/components/portal/vote-button";
import { getPortal, listRoadmapPosts, roadmapStatuses } from "@/lib/portal/queries";
import { currentVoterHash } from "@/lib/portal/voter";
import { postStatusLabels } from "@/lib/post-status";

export const metadata: Metadata = { title: "Roadmap" };

type Props = { params: Promise<{ org: string }> };

const columnHints = {
  planned: "Coming up next.",
  in_progress: "Being built right now.",
  complete: "Shipped. Thanks for the ideas!",
};

export default async function RoadmapPage({ params }: Props) {
  const { org } = await params;
  const { organization } = await getPortal(org);
  const posts = await listRoadmapPosts(organization.id, await currentVoterHash(organization.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roadmap</h1>
        <p className="mt-1 text-muted-foreground">
          What {organization.name} is planning, building and has shipped. Vote to move ideas up.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roadmapStatuses.map((status) => {
          const column = posts.filter((post) => post.status === status);
          return (
            <section
              key={status}
              aria-labelledby={`column-${status}`}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <h2 id={`column-${status}`} className="px-1 font-semibold">
                {postStatusLabels[status]}{" "}
                <span className="font-normal text-subtle-foreground">({column.length})</span>
              </h2>
              <p className="px-1 text-xs text-subtle-foreground">{columnHints[status]}</p>
              {column.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-center text-sm text-subtle-foreground">
                  Nothing here yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {column.map((post) => (
                    <li
                      key={post.id}
                      className="flex gap-3 rounded-lg border border-border bg-background p-3"
                    >
                      <VoteButton
                        organizationSlug={organization.slug}
                        postId={post.id}
                        voted={post.voted}
                        count={post.voteCount}
                        title={post.title}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/p/${organization.slug}/posts/${post.id}`}
                          className="text-sm font-medium hover:underline break-words"
                        >
                          {post.title}
                        </Link>
                        <p className="mt-1 text-xs text-subtle-foreground">{post.boardName}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
