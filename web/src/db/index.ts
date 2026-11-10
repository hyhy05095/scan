import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "server-only";

let database: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (database) return database;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to use Drizzle.");
  }

  const client = postgres(databaseUrl, {
    prepare: false,
  });

  database = drizzle({ client });
  return database;
}
