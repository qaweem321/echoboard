import type { BatchItem } from "drizzle-orm/batch";
import { db } from "./index";

type Database = typeof db;
type Statements = readonly [BatchItem<"pg">, ...BatchItem<"pg">[]];

// Runs several writes as one transaction: all of them happen, or none do.
// Build the statements with the `tx` you're given (not `db`), so they join the transaction.
export async function atomic(build: (tx: Database) => Statements) {
  await db.batch(build(db));
}
