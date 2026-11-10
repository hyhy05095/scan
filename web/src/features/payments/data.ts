import { and, eq } from "drizzle-orm";
import "server-only";

import { createClient } from "@/lib/supabase/server";

import { getDb } from "@/db";
import { paymentOrders, payments } from "@/db/schema";

export async function getCheckoutCustomer() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name")
    .eq("profile_id", data.user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  return {
    customerKey: data.user.id,
    email: data.user.email ?? null,
    name: profile?.name ?? getMetadataName(data.user.user_metadata) ?? null,
  };
}

export async function getPaymentHistory(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "approved_at, currency, order_id, order_name, payment_id, receipt_url, status, total_amount",
    )
    .eq("user_id", userId)
    .order("approved_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((payment) => ({
    approvedAt: payment.approved_at,
    currency: payment.currency,
    orderId: payment.order_id,
    orderName: payment.order_name,
    paymentId: payment.payment_id,
    receiptUrl: payment.receipt_url,
    status: payment.status,
    totalAmount: payment.total_amount,
  }));
}

export async function getOwnedOrder(orderId: string, userId: string) {
  const db = getDb();
  const [order] = await db
    .select()
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.order_id, orderId),
        eq(paymentOrders.user_id, userId),
      ),
    )
    .limit(1);
  return order ?? null;
}

export async function getOwnedPayment(orderId: string, userId: string) {
  const db = getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.order_id, orderId), eq(payments.user_id, userId)))
    .limit(1);
  return payment ?? null;
}

function getMetadataName(metadata: Record<string, unknown>) {
  return [metadata.name, metadata.display_name, metadata.full_name].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
}
