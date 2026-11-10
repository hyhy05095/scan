import { z } from "zod";

import { locales } from "@/i18n/config";

export const emailSchema = z
  .email("Enter a valid email address.")
  .trim()
  .toLowerCase()
  .max(254, "Email is too long.");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  locale: z.enum(locales),
});

export const passwordlessEmailSchema = z.object({
  email: emailSchema,
  locale: z.enum(locales),
});

export const otpVerifySchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the six-digit verification code."),
});

export const oauthSchema = z.object({
  locale: z.enum(locales),
  next: z.string().max(2048).optional(),
  provider: z.enum(["apple", "github", "google", "kakao"]),
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const joinSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(Boolean, {
      message: "You must accept the terms to create an account.",
    }),
    marketingConsent: z.boolean(),
    locale: z.enum(locales),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type JoinInput = z.infer<typeof joinSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
