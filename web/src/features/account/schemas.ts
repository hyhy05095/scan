import { z } from "zod";

import { emailSchema } from "@/features/auth/schemas";
import { locales } from "@/i18n/config";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

const avatarSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 1024 * 1024, "Avatar must be 1MB or smaller.")
  .refine(
    (file) =>
      ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
        file.type,
      ),
    "Use a PNG, JPG, GIF, or WebP image.",
  );

export const updateProfileSchema = z.object({
  avatar: avatarSchema.optional(),
  locale: z.enum(locales),
  marketingConsent: z.boolean(),
  name: z.string().trim().min(1, "Enter your name."),
});

export const changeEmailSchema = z.object({
  email: emailSchema,
  locale: z.enum(locales),
});

export const changePasswordSchema = z
  .object({
    confirmPassword: z.string(),
    locale: z.enum(locales),
    password: passwordSchema,
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const providerSchema = z.object({
  locale: z.enum(locales),
  provider: z.enum(["apple", "github", "google", "kakao"]),
});

export const deleteAccountSchema = z.object({
  confirmDeletion: z.boolean().refine(Boolean, {
    error: "Confirm that you want to delete your account.",
  }),
  confirmIrreversible: z.boolean().refine(Boolean, {
    error: "Confirm that you understand this action is irreversible.",
  }),
  locale: z.enum(locales),
});
