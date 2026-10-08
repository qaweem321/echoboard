import { and, asc, desc, eq, isNotNull, isNull, ne, or, type SQL, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { boards, comments, posts, users, voters, votes } from "@/db/schema";
import { INBOX_PAGE_SIZE, type InboxParams } from "@/lib/inbox-params";
import { isUuid } from "@/lib/uuid";
import { postSearchFilter } from "./filters";

// The team's view of feedback. Unlike the portal it includes closed posts.

export async function listInboxPosts(
  organizationId: string,
  boardId: string | null,
  params: InboxParams,
) {
  const filters: SQL[] = [eq(posts.organizationId, organizationId), isNull(posts.mergedIntoId)];
  if (params.status) {
    filters.push(eq(posts.status, params.status));
  }
  if (boardId) {
    filters.push(eq(posts.boardId, boardId));
  }
  const search = postSearchFilter(params.q);
  if (search) {
    filters.push(search);
  }

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      voteCount: posts.voteCount,
      commentCount: posts.commentCount,
      createdAt: posts.createdAt,
      boardName: boards.name,
    })
    .from(posts)
    .innerJoin(boards, eq(boards.id, posts.boardId))
    .where(and(...filters))
    .orderBy(
      ...(params.sort === "top"
        ? [desc(posts.voteCount), desc(posts.createdAt)]
        : [desc(posts.createdAt)]),
    )
    .limit(INBOX_PAGE_SIZE + 1)
    .offset((params.page - 1) * INBOX_PAGE_SIZE);

  return { posts: rows.slice(0, INBOX_PAGE_SIZE), hasMore: rows.length > INBOX_PAGE_SIZE };
}

// How many posts the "Merge into" list offers. Most-voted first, since duplicates are
// usually merged into the popular post.
const MERGE_TARGET_LIMIT = 300;
const VOTER_LIST_LIMIT = 100;

// Everything the team's post page shows, in four parallel queries.
export async function getInboxPost(organizationId: string, postId: string) {
  if (!isUuid(postId)) {
    notFound();
  }
  const [[post], postComments, namedVoters, mergeTargets] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        status: posts.status,
        boardId: posts.boardId,
        voteCount: posts.voteCount,
        commentCount: posts.commentCount,
        mergedIntoId: posts.mergedIntoId,
        createdAt: posts.createdAt,
        authorName: sql<string | null>`coalesce(${users.name}, ${voters.name})`,
        authorEmail: sql<string | null>`coalesce(${users.email}, ${voters.email})`,
      })
      .from(posts)
      .leftJoin(voters, eq(voters.id, posts.authorVoterId))
      .leftJoin(users, eq(users.id, posts.authorUserId))
      .where(and(eq(posts.id, postId), eq(posts.organizationId, organizationId)))
      .limit(1),
    db
      .select({
        id: comments.id,
        body: comments.body,
        createdAt: comments.createdAt,
        authorName: sql<string | null>`coalesce(${users.name}, ${voters.name})`,
        byTeam: sql<boolean>`${comments.authorUserId} is not null`,
      })
      .from(comments)
      .leftJoin(voters, eq(voters.id, comments.authorVoterId))
      .leftJoin(users, eq(users.id, comments.authorUserId))
      .where(and(eq(comments.postId, postId), eq(comments.organizationId, organizationId)))
      .orderBy(asc(comments.createdAt)),
    // Voters who left a name or email: the people to follow up with.
    db
      .select({ id: voters.id, name: voters.name, email: voters.email })
      .from(votes)
      .innerJoin(voters, eq(voters.id, votes.voterId))
      .innerJoin(posts, eq(posts.id, votes.postId))
      .where(
        and(
          eq(votes.postId, postId),
          eq(posts.organizationId, organizationId),
          or(isNotNull(voters.name), isNotNull(voters.email)),
        ),
      )
      .orderBy(asc(votes.createdAt))
      .limit(VOTER_LIST_LIMIT),
    db
      .select({ id: posts.id, title: posts.title, voteCount: posts.voteCount })
      .from(posts)
      .where(
        and(
          eq(posts.organizationId, organizationId),
          ne(posts.id, postId),
          isNull(posts.mergedIntoId),
        ),
      )
      .orderBy(desc(posts.voteCount), asc(posts.title))
      .limit(MERGE_TARGET_LIMIT),
  ]);

  if (!post) {
    notFound();
  }
  return { post, comments: postComments, namedVoters, mergeTargets };
}
