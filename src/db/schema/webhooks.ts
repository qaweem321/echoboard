// Outgoing webhooks: a workspace's URLs that get a signed POST when feedback changes.
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const webhooks = pgTable(
  "webhooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    // "whsec_..." (Standard Webhooks format). Receivers use it to check the signature.
    secret: text("secret").notNull(),
    // The last delivery, to help people debug their endpoint.
    lastStatus: integer("last_status"),
    lastError: text("last_error"),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("webhooks_organization_idx").on(table.organizationId)],
);
