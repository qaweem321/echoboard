import { asc, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db";
import { boards, posts } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/session";
import { deleteBoard } from "./actions";
import { BoardForm } from "./board-form";

export const metadata: Metadata = { title: "Boards" };

export default async function BoardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization, role } = await requireMembership(slug);

  // Boards with their post counts in one query.
  const rows = await db
    .select({
      id: boards.id,
      name: boards.name,
      slug: boards.slug,
      description: boards.description,
      createdAt: boards.createdAt,
      postCount: count(posts.id),
    })
    .from(boards)
    .leftJoin(posts, eq(posts.boardId, boards.id))
    .where(eq(boards.organizationId, organization.id))
    .groupBy(boards.id)
    .orderBy(asc(boards.createdAt), asc(boards.name));

  const canManage = can(role, "board:manage");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Boards</h1>
      <p className="mt-1 text-muted-foreground">
        Boards group the feedback people send you, for example &ldquo;Feature requests&rdquo; and
        &ldquo;Bugs&rdquo;.
      </p>

      {canManage && (
        <div className="mt-8">
          <BoardForm slug={slug} />
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">No boards yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? "Add your first board with the form above."
              : "An owner or admin can add the first board."}
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-xl border border-border">
          {rows.map((board) => (
            <li key={board.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{board.name}</p>
                  {board.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{board.description}</p>
                  )}
                  <p className="mt-1 text-xs text-subtle-foreground">
                    {board.postCount} {board.postCount === 1 ? "post" : "posts"} · /{board.slug} ·
                    Created {formatDate(board.createdAt)}
                  </p>
                </div>
                {canManage && (
                  <form action={deleteBoard}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="boardId" value={board.id} />
                    <SubmitButton
                      variant="danger-link"
                      size="inline"
                      pendingText="Deleting..."
                      confirm={`Delete "${board.name}" and its ${board.postCount} posts? This cannot be undone.`}
                      aria-label={`Delete ${board.name}`}
                    >
                      Delete
                    </SubmitButton>
                  </form>
                )}
              </div>
              {canManage && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-link">Edit</summary>
                  <div className="mt-3">
                    <BoardForm slug={slug} board={board} />
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
