import { getSessionCookie } from "better-auth/cookies";
import { and, asc, desc, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import {
  boards,
  comments,
  memberships,
  organizations,
  posts,
  users,
  voters,
  votes,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { postSearchFilter } from "@/lib/feedback/filters";
import { PORTAL_PAGE_SIZE, type PortalParams } from "@/lib/portal-params";
import { listedStatuses } from "@/lib/post-status";
import { isUuid } from "@/lib/uuid";

// A workspace's public portal: the organization and its boards, in one query.
// Cached per request, so the layout, page and metadata share it.
export const getPortal = cache(async (organizationSlug: string) => {
  const rows = await db
    .select({
      organization: { id: organizations.id, name: organizations.name, slug: organizations.slug },
      board: {
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        description: boards.description,
      },
    })
    .from(organizations)
    .leftJoin(boards, eq(boards.organizationId, organizations.id))
    .where(eq(organizations.slug, organizationSlug))
    .orderBy(asc(boards.createdAt), asc(boards.name));

  if (rows.length === 0) {
    notFound();
  }
  return {
    organization: rows[0].organization,
    boards: rows.flatMap((row) => (row.board ? [row.board] : [])),
  };
});

export type Portal = Awaited<ReturnType<typeof getPortal>>;

// Whether this visitor (by voter cookie hash) voted for the post in the current row.
function votedBy(voterHash: string | null) {
  if (!voterHash) {
    return sql<boolean>`false`;
  }
  return sql<boolean>`exists (
    select 1 from ${votes} inner join ${voters} on ${voters.id} = ${votes.voterId}
    where ${votes.postId} = ${posts.id} and ${voters.tokenHash} = ${voterHash}
  )`;
}

// Posts for the portal list, with the visitor's votes, in one query. Fetches one extra row
// to know whether there is a next page without counting everything.
export async function listPortalPosts(
  organizationId: string,
  boardId: string | null,
  params: PortalParams,
  voterHash: string | null,
) {
  const filters: SQL[] = [
    eq(posts.organizationId, organizationId),
    isNull(posts.mergedIntoId),
    inArray(posts.status, listedStatuses),
  ];
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
      body: posts.body,
      status: posts.status,
      voteCount: posts.voteCount,
      commentCount: posts.commentCount,
      createdAt: posts.createdAt,
      boardName: boards.name,
      voted: votedBy(voterHash),
    })
    .from(posts)
    .innerJoin(boards, eq(boards.id, posts.boardId))
    .where(and(...filters))
    .orderBy(
      ...(params.sort === "new"
        ? [desc(posts.createdAt)]
        : [desc(posts.voteCount), desc(posts.createdAt)]),
    )
    .limit(PORTAL_PAGE_SIZE + 1)
    .offset((params.page - 1) * PORTAL_PAGE_SIZE);

  return { posts: rows.slice(0, PORTAL_PAGE_SIZE), hasMore: rows.length > PORTAL_PAGE_SIZE };
}

export type PortalPost = Awaited<ReturnType<typeof listPortalPosts>>["posts"][number];

export const roadmapStatuses = ["planned", "in_progress", "complete"] as const;
const ROADMAP_LIMIT = 300;

// Posts on the public roadmap, most-voted first, with the visitor's votes. One query;
// the page splits them into columns.
export async function listRoadmapPosts(organizationId: string, voterHash: string | null) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      voteCount: posts.voteCount,
      boardName: boards.name,
      voted: votedBy(voterHash),
    })
    .from(posts)
    .innerJoin(boards, eq(boards.id, posts.boardId))
    .where(
      and(
        eq(posts.organizationId, organizationId),
        isNull(posts.mergedIntoId),
        inArray(posts.status, [...roadmapStatuses]),
      ),
    )
    .orderBy(desc(posts.voteCount), desc(posts.updatedAt))
    .limit(ROADMAP_LIMIT);
}

// One post with its comments. The two queries run in parallel.
export async function getPortalPost(
  organizationId: string,
  postId: string,
  voterHash: string | null,
) {
  if (!isUuid(postId)) {
    notFound();
  }
  const [[post], postComments] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        status: posts.status,
        voteCount: posts.voteCount,
        commentCount: posts.commentCount,
        createdAt: posts.createdAt,
        mergedIntoId: posts.mergedIntoId,
        board: { name: boards.name, slug: boards.slug },
        authorName: sql<string | null>`coalesce(${users.name}, ${voters.name})`,
        byTeam: sql<boolean>`${posts.authorUserId} is not null`,
        voted: votedBy(voterHash),
      })
      .from(posts)
      .innerJoin(boards, eq(boards.id, posts.boardId))
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
  ]);

  if (!post) {
    notFound();
  }
  return { post, comments: postComments };
}

// A logged-in member of this workspace, so their posts and comments show as "Team".
// Visitors without a login cookie skip the database entirely.
export const getTeamViewer = cache(async (organizationId: string) => {
  const requestHeaders = await headers();
  if (!getSessionCookie(requestHeaders)) {
    return null;
  }
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }
  const isMember = await db.$count(
    memberships,
    and(eq(memberships.organizationId, organizationId), eq(memberships.userId, session.user.id)),
  );
  return isMember > 0 ? { userId: session.user.id, name: session.user.name } : null;
});
