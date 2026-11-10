import { sql } from "drizzle-orm";
import { boolean, pgPolicy, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "./helpers";

export const profiles = pgTable(
  "profiles",
  {
    profile_id: uuid("profile_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    avatar_url: text("avatar_url"),
    marketing_consent: boolean("marketing_consent").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    pgPolicy("edit-profile-policy", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.profile_id}`,
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    pgPolicy("delete-profile-policy", {
      as: "permissive",
      for: "delete",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.profile_id}`,
    }),
    pgPolicy("select-profile-policy", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ],
);
