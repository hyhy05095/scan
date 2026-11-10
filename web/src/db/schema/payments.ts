import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "./helpers";

export const payments = pgTable(
  "payments",
  {
    payment_id: bigint("payment_id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    payment_key: text("payment_key")
      .notNull()
      .unique("payments_payment_key_unique"),
    order_id: text("order_id").notNull().unique("payments_order_id_unique"),
    order_name: text("order_name").notNull(),
    currency: text("currency").default("KRW").notNull(),
    total_amount: numeric("total_amount", {
      precision: 15,
      scale: 2,
      mode: "number",
    }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, string>>().notNull(),
    receipt_url: text("receipt_url").notNull(),
    status: text("status").notNull(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    approved_at: timestamp("approved_at", { withTimezone: true }).notNull(),
    requested_at: timestamp("requested_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("payments_user_id_index").on(table.user_id),
    check("payments_positive_amount_check", sql`${table.total_amount} > 0`),
    check("payments_currency_check", sql`${table.currency} IN ('KRW')`),
    pgPolicy("select-payment-policy", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

export const paymentOrders = pgTable(
  "payment_orders",
  {
    order_id: text("order_id").primaryKey(),
    order_name: text("order_name").notNull(),
    amount: numeric("amount", {
      precision: 15,
      scale: 2,
      mode: "number",
    }).notNull(),
    currency: text("currency").default("KRW").notNull(),
    metadata: jsonb("metadata").$type<Record<string, string>>().notNull(),
    status: text("status").default("PENDING").notNull(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("payment_orders_user_id_index").on(table.user_id),
    check(
      "payment_orders_order_id_check",
      sql`${table.order_id} ~ '^[A-Za-z0-9_-]{6,64}$'`,
    ),
    check("payment_orders_positive_amount_check", sql`${table.amount} > 0`),
    check("payment_orders_currency_check", sql`${table.currency} IN ('KRW')`),
    check(
      "payment_orders_status_check",
      sql`${table.status} IN ('PENDING', 'APPROVED', 'FAILED')`,
    ),
  ],
).enableRLS();
