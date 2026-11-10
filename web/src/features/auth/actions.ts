"use server";

import {
  actionClient,
  authenticatedActionClient,
  returnAppError,
} from "@/lib/safe-action";
import { getSafeNextPath, getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

import { localizePath } from "@/i18n/config";

import { doesUserExist } from "./data";
import {
  forgotPasswordSchema,
  joinSchema,
  loginSchema,
  newPasswordSchema,
  oauthSchema,
  otpVerifySchema,
  passwordlessEmailSchema,
} from "./schemas";

export const joinAction = actionClient
  .inputSchema(joinSchema)
  .action(async ({ parsedInput }) => {
    if (await doesUserExist(parsedInput.email)) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "There is an account with this email already.",
      });
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsedInput.email,
      password: parsedInput.password,
      options: {
        data: {
          name: parsedInput.name,
          display_name: parsedInput.name,
          locale: parsedInput.locale,
          marketing_consent: parsedInput.marketingConsent,
        },
        emailRedirectTo: new URL(
          `${localizePath(parsedInput.locale, "/auth/confirm")}?next=${encodeURIComponent(localizePath(parsedInput.locale, "/"))}`,
          getSiteUrl(),
        ).toString(),
      },
    });

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "We could not create your account. Please try again.",
      });
    }

    return { signedIn: Boolean(data.session) };
  });

export const loginAction = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsedInput);

    if (error) {
      if (error.code === "email_not_confirmed") {
        returnAppError({
          code: "EMAIL_NOT_CONFIRMED",
          message: "Email not confirmed.",
        });
      }

      returnAppError({
        code: "AUTH_FAILED",
        message: "Invalid email or password.",
      });
    }

    return { success: true };
  });

export const forgotPasswordAction = actionClient
  .inputSchema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const confirmPath = localizePath(parsedInput.locale, "/auth/confirm");
    const newPasswordPath = localizePath(
      parsedInput.locale,
      "/auth/new-password",
    );
    const redirectTo = new URL(
      `${confirmPath}?next=${encodeURIComponent(newPasswordPath)}`,
      getSiteUrl(),
    ).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsedInput.email,
      { redirectTo },
    );

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "We could not send the reset link. Please try again.",
      });
    }

    // Supabase intentionally does not reveal whether the address exists.
    return { success: true };
  });

export const resendVerificationAction = actionClient
  .inputSchema(passwordlessEmailSchema)
  .action(async ({ parsedInput }) => {
    const confirmPath = localizePath(parsedInput.locale, "/auth/confirm");
    const dashboardPath = localizePath(parsedInput.locale, "/");
    const emailRedirectTo = new URL(
      `${confirmPath}?next=${encodeURIComponent(dashboardPath)}`,
      getSiteUrl(),
    ).toString();
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      email: parsedInput.email,
      options: { emailRedirectTo },
      type: "signup",
    });

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message:
          "We could not resend the verification email. Please try again later.",
      });
    }

    return { success: true };
  });

export const newPasswordAction = authenticatedActionClient
  .inputSchema(newPasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase.auth.updateUser({
      password: parsedInput.password,
    });

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "We could not update your password. Please try again.",
      });
    }

    return { success: true };
  });

export const magicLinkAction = actionClient
  .inputSchema(passwordlessEmailSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const redirectTo = new URL(
      `${localizePath(parsedInput.locale, "/auth/confirm")}?next=${encodeURIComponent(localizePath(parsedInput.locale, "/"))}`,
      getSiteUrl(),
    ).toString();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsedInput.email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    });

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message:
          error.code === "otp_disabled"
            ? "Create an account before signing in."
            : error.message,
      });
    }

    return { success: true };
  });

export const requestOtpAction = actionClient
  .inputSchema(passwordlessEmailSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsedInput.email,
      options: { shouldCreateUser: false },
    });

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "We could not send the verification code. Please try again.",
      });
    }

    return { email: parsedInput.email };
  });

export const verifyOtpAction = actionClient
  .inputSchema(otpVerifySchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: parsedInput.email,
      token: parsedInput.code,
      type: "email",
    });

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "That verification code is invalid or expired.",
      });
    }

    return { success: true };
  });

export const startOAuthAction = actionClient
  .inputSchema(oauthSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const callbackPath = localizePath(
      parsedInput.locale,
      "/auth/social/callback",
    );
    const nextPath = getSafeNextPath(
      parsedInput.next ?? null,
      localizePath(parsedInput.locale, "/"),
    );
    const redirectTo = new URL(
      `${callbackPath}?next=${encodeURIComponent(nextPath)}`,
      getSiteUrl(),
    ).toString();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: parsedInput.provider,
      options: { redirectTo },
    });

    if (error || !data.url) {
      returnAppError({
        code: "AUTH_FAILED",
        message: `We could not start ${parsedInput.provider} login.`,
      });
    }

    return { url: data.url };
  });

export const logoutAction = authenticatedActionClient.action(
  async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut();

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "We could not log you out. Please try again.",
      });
    }

    return { success: true };
  },
);
