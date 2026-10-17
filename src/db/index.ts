import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseDriver } from "./driver";
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

// For scripts (seed, demo reset): an open Postgres connection keeps Node running, so a script
// would never exit on Docker or any non-Neon database without this.
export async function closeDb() {
  await postgresClient?.end();
}
