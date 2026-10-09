// The feedback product: boards, the ideas posted on them, votes and comments.
// Every table carries organizationId (directly or through its post), and every query filters by it.

import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
// Relative path: drizzle-kit reads this file without the "@/" alias.
import { postStatuses } from "../../lib/post-status";
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
    // Set when they click "unsubscribe" in an update email. Applies to every voter row with
    // the same email in the workspace.
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("voters_organization_email_idx").on(table.organizationId, table.email)],
);

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
    // Word search on titles, for "similar ideas" hints (src/lib/feedback/similar.ts).
    index("posts_title_search_idx").using("gin", sql`to_tsvector('english', ${table.title})`),
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

// A changelog announcement. Drafts have no publishedAt and are only visible to the team.
export const changelogEntries = pgTable(
  "changelog_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("changelog_organization_published_idx").on(table.organizationId, table.publishedAt),
  ],
);

// The ideas a changelog entry announces as shipped.
export const changelogEntryPosts = pgTable(
  "changelog_entry_posts",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => changelogEntries.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.entryId, table.postId] }),
    index("changelog_entry_posts_post_idx").on(table.postId),
  ],
);
