import { z } from "zod";

import { emailSchema } from "@/features/auth/schemas";

export const contactSchema = z.object({
  email: emailSchema,
  hcaptchaToken: z.string().min(1, "Complete the hCaptcha challenge."),
  message: z.string().trim().min(1, "Enter your message."),
  name: z.string().trim().min(1, "Enter your name."),
  submissionId: z.uuid(),
  turnstileToken: z.string().min(1, "Complete the Turnstile challenge."),
});
