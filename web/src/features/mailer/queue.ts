import * as Sentry from "@sentry/nextjs";
import { sql } from "drizzle-orm";
import "server-only";
import { z } from "zod";

import { createResendClient } from "@/lib/resend";

import { getDb } from "@/db";
import { locales } from "@/i18n/config";

import WelcomeEmail from "../../../transactional-emails/emails/welcome";

const QUEUE_NAME = "mailer";
const DEAD_LETTER_QUEUE_NAME = "mailer_dead_letters";
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 10;
const VISIBILITY_TIMEOUT_SECONDS = 300;

const envelopeSchema = z.object({
  message: z.unknown(),
  msg_id: z.string(),
  read_ct: z.coerce.number().int().positive(),
});

const mailerMessageSchema = z.object({
  data: z.object({
    locale: z.enum(locales),
    name: z.string().trim().min(1),
  }),
  eventId: z.uuid(),
  template: z.literal("welcome"),
  to: z.email().max(254),
});

type ProcessingStatus = "sent" | "retrying" | "deadLettered";

export async function processMailerQueue() {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from)
    throw new Error(
      "RESEND_FROM_EMAIL is required to process the mailer queue.",
    );

  const resend = createResendClient();
  const db = getDb();
  // PGMQ read leases a bounded batch. Unacknowledged messages become visible
  // after the timeout: https://supabase.com/docs/guides/queues/api
  const result = await db.execute(sql`
    SELECT
      "msg_id"::text AS "msg_id",
      "read_ct",
      "message"
    FROM "pgmq"."read"(
      ${QUEUE_NAME}::text,
      ${VISIBILITY_TIMEOUT_SECONDS}::integer,
      ${BATCH_SIZE}::integer
    )
  `);

  const statuses = await Promise.all(
    Array.from(result).map(async (row): Promise<ProcessingStatus> => {
      const envelope = envelopeSchema.safeParse(row);
      if (!envelope.success) {
        Sentry.captureException(envelope.error, {
          tags: { feature: "mailer", operation: "parse-envelope" },
        });
        return "retrying";
      }

      const parsed = mailerMessageSchema.safeParse(envelope.data.message);
      if (!parsed.success) {
        Sentry.captureException(parsed.error, {
          tags: { feature: "mailer", operation: "parse-message" },
        });
        await moveToDeadLetters({
          failureReason: "Invalid mailer message payload.",
          message: envelope.data.message,
          msgId: envelope.data.msg_id,
          readCount: envelope.data.read_ct,
        });
        return "deadLettered";
      }

      try {
        const message = parsed.data;
        const { error } = await resend.emails.send(
          {
            from,
            react: WelcomeEmail({
              profile: JSON.stringify({ name: message.data.name }),
            }),
            subject:
              message.data.locale === "ko"
                ? "Supanext에 오신 것을 환영합니다"
                : message.data.locale === "es"
                  ? "Te damos la bienvenida a Supanext"
                  : "Welcome to Supanext",
            to: message.to,
          },
          // Resend deduplicates this key for 24 hours:
          // https://resend.com/docs/dashboard/emails/idempotency-keys
          { idempotencyKey: `welcome-user/${message.eventId}` },
        );

        if (error) throw new Error(error.message);
        await deleteMessage(envelope.data.msg_id);
        return "sent";
      } catch (caught) {
        const error =
          caught instanceof Error
            ? caught
            : new Error("Unknown mailer failure");
        Sentry.captureException(error, {
          tags: {
            feature: "mailer",
            messageId: envelope.data.msg_id,
            readCount: String(envelope.data.read_ct),
          },
        });

        if (envelope.data.read_ct >= MAX_ATTEMPTS) {
          await moveToDeadLetters({
            failureReason: error.message.slice(0, 500),
            message: parsed.data,
            msgId: envelope.data.msg_id,
            readCount: envelope.data.read_ct,
          });
          return "deadLettered";
        }
        return "retrying";
      }
    }),
  );

  return statuses.reduce(
    (summary, status) => ({ ...summary, [status]: summary[status] + 1 }),
    { deadLettered: 0, retrying: 0, sent: 0 },
  );
}

async function deleteMessage(msgId: string) {
  const db = getDb();
  await db.execute(
    sql`SELECT "pgmq"."delete"(${QUEUE_NAME}::text, ${msgId}::bigint)`,
  );
}

async function moveToDeadLetters({
  failureReason,
  message,
  msgId,
  readCount,
}: {
  failureReason: string;
  message: unknown;
  msgId: string;
  readCount: number;
}) {
  const db = getDb();
  const deadLetter = JSON.stringify({
    failedAt: new Date().toISOString(),
    failureReason,
    message,
    readCount,
    sourceMessageId: msgId,
  });

  await db.transaction(async (transaction) => {
    await transaction.execute(
      sql`SELECT "pgmq"."send"(${DEAD_LETTER_QUEUE_NAME}::text, ${deadLetter}::jsonb)`,
    );
    await transaction.execute(
      sql`SELECT "pgmq"."delete"(${QUEUE_NAME}::text, ${msgId}::bigint)`,
    );
  });
}
