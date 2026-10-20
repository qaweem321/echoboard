import { neon } from "@neondatabase/serverless";
import type { SQL } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseDriver, rowsOf } from "./driver";
import * as schema from "./schema";

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  return url;
}

type Database = ReturnType<typeof drizzleNeon<typeof schema>>;

export const driver = databaseDriver();

function connect(url: string): Database {
  if (driver === "neon") {
    return drizzleNeon({ client: neon(url), schema });
  }
  // Both drivers have the same query API, so the app uses one type. The one difference
  // (batch) is handled by atomic() in ./atomic.ts.
  postgresClient = postgres(url);
  return drizzlePostgres({ client: postgresClient, schema }) as unknown as Database;
}

// Set when the normal Postgres driver is used. Neon's HTTP driver holds no open connection.
let postgresClient: ReturnType<typeof postgres> | null = null;

export const db = connect(databaseUrl());

// For scripts (seed): an open Postgres connection keeps Node running, so a script
// would never exit on Docker or any non-Neon database without this.
export async function closeDb() {
  await postgresClient?.end();
}

// Raw SQL with `db.execute` returns `{ rows }` on Neon's HTTP driver but a plain array on the
// normal Postgres driver. Run raw queries through this so both give the same rows.
export async function queryRows<Row extends Record<string, unknown>>(query: SQL): Promise<Row[]> {
  return rowsOf<Row>(await db.execute(query));
}
