// The feedback product: boards, the ideas posted on them, votes and comments.
// Every table carries organizationId (directly or through its post), and every query filters by it.
import {
  type AnyPgColumn,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { organizations } from "./organizations";

// A board groups related feedback, e.g. "Feature requests" or "Bugs".
export const boards = pgTable(
  "boards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Used in the public portal URL, unique within the organization.
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.organizationId, table.slug)],
);

// A person using an organization's public portal or widget. Not a login account: they are
// recognised by a random browser cookie (only its hash is stored) and may add a name and email
// so they can be told when their idea ships.
export const voters = pgTable(
  "voters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    name: text("name"),
    // Stored in lowercase.
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("voters_organization_email_idx").on(table.organizationId, table.email)],
);

export const postStatuses = [
  "open",
  "under_review",
  "planned",
  "in_progress",
  "complete",
  "closed",
] as const;
export const postStatusEnum = pgEnum("post_status", postStatuses);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    status: postStatusEnum("status").notNull().default("open"),
    // Kept in sync when votes and comments change, so lists sort without counting rows.
    voteCount: integer("vote_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    // Posted by a portal visitor or by a team member (one of the two, or neither if deleted).
    authorVoterId: uuid("author_voter_id").references(() => voters.id, { onDelete: "set null" }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    // Set when a team member merges this post into another (duplicate).
    mergedIntoId: uuid("merged_into_id").references((): AnyPgColumn => posts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("posts_board_votes_idx").on(table.boardId, table.voteCount),
    index("posts_organization_status_idx").on(table.organizationId, table.status),
  ],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    voterId: uuid("voter_id")
      .notNull()
      .references(() => voters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.postId, table.voterId), index("votes_voter_idx").on(table.voterId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    authorVoterId: uuid("author_voter_id").references(() => voters.id, { onDelete: "set null" }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("comments_post_idx").on(table.postId, table.createdAt)],
);
