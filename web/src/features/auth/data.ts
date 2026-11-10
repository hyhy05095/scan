import { sql } from "drizzle-orm";
import "server-only";

import { getDb } from "@/db";

export async function doesUserExist(email: string) {
  const rows = await getDb().execute<{ exists: boolean }>(
    sql`select exists(select 1 from auth.users where lower(email) = lower(${email})) as "exists"`,
  );
  return rows[0]?.exists ?? false;
}
