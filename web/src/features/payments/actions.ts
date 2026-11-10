"use server";

import { randomUUID } from "node:crypto";

import { authenticatedActionClient } from "@/lib/safe-action";

import { getDb } from "@/db";
import { paymentOrders } from "@/db/schema";

import { demoProduct } from "./product";
import { createPaymentOrderSchema } from "./schemas";

export const createPaymentOrderAction = authenticatedActionClient
  .inputSchema(createPaymentOrderSchema)
  .action(async ({ ctx }) => {
    const db = getDb();
    const orderId = randomUUID();

    await db.insert(paymentOrders).values({
      amount: demoProduct.amount,
      currency: demoProduct.currency,
      metadata: { productId: demoProduct.id },
      order_id: orderId,
      order_name: demoProduct.name,
      user_id: ctx.userId,
    });

    return {
      amount: demoProduct.amount,
      currency: demoProduct.currency,
      orderId,
      orderName: demoProduct.name,
    };
  });
