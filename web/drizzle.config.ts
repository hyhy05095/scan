import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run Drizzle Kit commands.");
}

export default defineConfig({
  schema: "./src/db/schema/**/*.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  entities: {
    roles: {
      provider: "supabase",
    },
  },
  strict: true,
  verbose: true,
});
