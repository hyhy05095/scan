import { z } from "zod";

import { locales } from "@/i18n/config";

export const createPaymentOrderSchema = z.object({
  locale: z.enum(locales),
});

export const paymentRedirectSchema = z.object({
  amount: z.coerce.number().int().positive(),
  orderId: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/),
  paymentKey: z.string().min(1).max(200),
  paymentType: z.string().max(30).optional(),
});

export const tossPaymentResponseSchema = z.object({
  approvedAt: z.iso.datetime({ offset: true }),
  currency: z.literal("KRW"),
  metadata: z.record(z.string(), z.string()).nullable(),
  orderId: z.string(),
  orderName: z.string(),
  paymentKey: z.string(),
  receipt: z.object({
    url: z.url().refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    }, "Receipt URL must use HTTP or HTTPS."),
  }),
  requestedAt: z.iso.datetime({ offset: true }),
  status: z.literal("DONE"),
  totalAmount: z.number().int().positive(),
});

export const tossErrorResponseSchema = z.object({
  code: z.string().max(100),
  message: z.string().max(500),
});
