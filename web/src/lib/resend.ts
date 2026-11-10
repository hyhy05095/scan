import { Resend } from "resend";
import "server-only";

export function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send email.");
  }
  return new Resend(apiKey);
}
