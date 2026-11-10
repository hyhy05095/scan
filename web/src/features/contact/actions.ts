"use server";

import * as Sentry from "@sentry/nextjs";
import { returnValidationErrors } from "next-safe-action";
import { randomUUID } from "node:crypto";

import { createResendClient } from "@/lib/resend";
import { actionClient, returnAppError } from "@/lib/safe-action";

import { ContactEmail } from "../../../transactional-emails/emails/contact";
import { contactSchema } from "./schema";

type CaptchaResponse = { success?: boolean };

export const contactAction = actionClient
  .inputSchema(contactSchema)
  .action(async ({ parsedInput }) => {
    const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY;
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!hcaptchaSecret || !turnstileSecret || !adminEmail || !fromEmail) {
      returnAppError({
        code: "INTERNAL",
        message: "The contact form is not configured yet.",
      });
    }

    const [hcaptcha, turnstile] = await Promise.all([
      verifyCaptcha("https://api.hcaptcha.com/siteverify", {
        response: parsedInput.hcaptchaToken,
        secret: hcaptchaSecret,
      }),
      verifyCaptcha(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          idempotency_key: randomUUID(),
          response: parsedInput.turnstileToken,
          secret: turnstileSecret,
        },
      ),
    ]);

    if (!hcaptcha || !turnstile) {
      returnValidationErrors(contactSchema, {
        ...(!hcaptcha
          ? {
              hcaptchaToken: {
                _errors: ["hCaptcha verification failed. Try again."],
              },
            }
          : {}),
        ...(!turnstile
          ? {
              turnstileToken: {
                _errors: ["Turnstile verification failed. Try again."],
              },
            }
          : {}),
      });
    }

    const resend = createResendClient();
    const { error } = await resend.emails.send(
      {
        from: fromEmail,
        react: ContactEmail(parsedInput),
        replyTo: parsedInput.email,
        subject: `New Supanext contact from ${parsedInput.name}`,
        to: adminEmail,
      },
      { idempotencyKey: `contact-${parsedInput.submissionId}` },
    );

    if (error) {
      Sentry.captureException(error, { tags: { feature: "contact" } });
      returnAppError({
        code: "INTERNAL",
        message: "We could not send your message. Please try again.",
      });
    }

    return { success: true };
  });

async function verifyCaptcha(url: string, body: Record<string, string>) {
  try {
    const response = await fetch(url, {
      body: new URLSearchParams(body),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as CaptchaResponse;
    return result.success === true;
  } catch {
    return false;
  }
}
