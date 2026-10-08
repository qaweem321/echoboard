import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { qualified } from "./qualified";
import { changelogEntries, posts } from "./schema";

test("qualified always includes the table name", () => {
  const query = new PgDialect().sqlToQuery(
    sql`${qualified(changelogEntries.id)} = ${qualified(posts.voteCount)}`,
  );
  assert.equal(query.sql, `"changelog_entries"."id" = "posts"."vote_count"`);
});
