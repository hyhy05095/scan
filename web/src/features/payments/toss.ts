import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { Buffer } from "node:buffer";
import "server-only";

import { getDb } from "@/db";
import { paymentOrders, payments } from "@/db/schema";

import { getOwnedOrder, getOwnedPayment } from "./data";
import { tossErrorResponseSchema, tossPaymentResponseSchema } from "./schemas";

export class PaymentConfirmationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PaymentConfirmationError";
  }
}

export async function confirmPayment({
  amountFromRedirect,
  orderId,
  paymentKey,
  userId,
}: {
  amountFromRedirect: number;
  orderId: string;
  paymentKey: string;
  userId: string;
}) {
  const existingPayment = await getOwnedPayment(orderId, userId);
  if (existingPayment) {
    if (existingPayment.payment_key !== paymentKey) {
      throw new PaymentConfirmationError(
        "ORDER_ALREADY_PAID",
        "This order is already associated with another payment.",
      );
    }
    return existingPayment;
  }

  const order = await getOwnedOrder(orderId, userId);
  if (!order) {
    throw new PaymentConfirmationError(
      "ORDER_NOT_FOUND",
      "We could not find this order for your account.",
    );
  }
  if (order.status !== "PENDING") {
    throw new PaymentConfirmationError(
      "ORDER_NOT_PENDING",
      "This order can no longer be confirmed.",
    );
  }
  // Toss requires the successUrl amount to be checked against merchant-owned
  // order data before confirmation: https://docs.tosspayments.com/guides/v2/get-started/payment-flow
  if (order.amount !== amountFromRedirect) {
    throw new PaymentConfirmationError(
      "AMOUNT_MISMATCH",
      "The returned amount does not match the original order.",
    );
  }

  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentConfirmationError(
      "NOT_CONFIGURED",
      "Toss Payments is not configured yet.",
    );
  }

  let response: Response;
  try {
    // Basic authentication and Idempotency-Key follow the current Core API:
    // https://docs.tosspayments.com/en/api-guide
    response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      body: JSON.stringify({ amount: order.amount, orderId, paymentKey }),
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": orderId,
      },
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (caught) {
    Sentry.captureException(caught, {
      tags: { feature: "payments", provider: "toss" },
    });
    throw new PaymentConfirmationError(
      "TOSS_UNAVAILABLE",
      "Toss Payments could not be reached. Please try again.",
    );
  }
  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const providerError = tossErrorResponseSchema.safeParse(responseBody);
    const error = new PaymentConfirmationError(
      providerError.success ? providerError.data.code : "TOSS_CONFIRM_FAILED",
      providerError.success
        ? providerError.data.message
        : "Toss Payments could not confirm this payment.",
    );
    Sentry.captureException(error, {
      tags: { feature: "payments", provider: "toss" },
    });
    throw error;
  }

  const parsed = tossPaymentResponseSchema.safeParse(responseBody);
  if (!parsed.success) {
    Sentry.captureException(parsed.error, {
      tags: { feature: "payments", provider: "toss" },
    });
    throw new PaymentConfirmationError(
      "INVALID_PROVIDER_RESPONSE",
      "Toss Payments returned an invalid response.",
    );
  }

  const confirmed = parsed.data;
  if (
    confirmed.orderId !== order.order_id ||
    confirmed.orderName !== order.order_name ||
    confirmed.paymentKey !== paymentKey ||
    confirmed.totalAmount !== order.amount ||
    confirmed.currency !== order.currency
  ) {
    throw new PaymentConfirmationError(
      "PROVIDER_MISMATCH",
      "The confirmed payment does not match the original order.",
    );
  }

  const db = getDb();
  await db.transaction(async (transaction) => {
    const inserted = await transaction
      .insert(payments)
      .values({
        approved_at: new Date(confirmed.approvedAt),
        currency: confirmed.currency,
        metadata: order.metadata,
        order_id: confirmed.orderId,
        order_name: order.order_name,
        payment_key: confirmed.paymentKey,
        receipt_url: confirmed.receipt.url,
        requested_at: new Date(confirmed.requestedAt),
        status: confirmed.status,
        total_amount: confirmed.totalAmount,
        user_id: userId,
      })
      .onConflictDoNothing({ target: payments.order_id })
      .returning({ paymentKey: payments.payment_key });

    if (inserted.length === 0) {
      const [concurrentPayment] = await transaction
        .select({ paymentKey: payments.payment_key })
        .from(payments)
        .where(
          and(eq(payments.order_id, orderId), eq(payments.user_id, userId)),
        )
        .limit(1);
      if (concurrentPayment?.paymentKey !== paymentKey) {
        throw new PaymentConfirmationError(
          "PAYMENT_CONFLICT",
          "This order conflicts with another payment.",
        );
      }
    }

    await transaction
      .update(paymentOrders)
      .set({ status: "APPROVED" })
      .where(
        and(
          eq(paymentOrders.order_id, orderId),
          eq(paymentOrders.user_id, userId),
        ),
      );
  });

  const savedPayment = await getOwnedPayment(orderId, userId);
  if (!savedPayment || savedPayment.payment_key !== paymentKey) {
    throw new PaymentConfirmationError(
      "PAYMENT_SAVE_FAILED",
      "The payment was confirmed but could not be recorded safely.",
    );
  }
  return savedPayment;
}
