"use server";

import * as Sentry from "@sentry/nextjs";
import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";

import { authenticatedActionClient, returnAppError } from "@/lib/safe-action";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

import { localizePath } from "@/i18n/config";

import { hasValidImageSignature } from "./image-validation";
import {
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  providerSchema,
  updateProfileSchema,
} from "./schemas";

export const updateProfileAction = authenticatedActionClient
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    let avatarUrl: string | null | undefined;

    if (parsedInput.avatar) {
      if (!(await hasValidImageSignature(parsedInput.avatar))) {
        returnValidationErrors(updateProfileSchema, {
          avatar: {
            _errors: ["The avatar file does not match its image type."],
          },
        });
      }

      const avatarPath = ctx.userId;
      const { error: uploadError } = await ctx.supabase.storage
        .from("avatars")
        .upload(avatarPath, parsedInput.avatar, {
          cacheControl: "3600",
          contentType: parsedInput.avatar.type,
          upsert: true,
        });

      if (uploadError) {
        returnAppError({
          code: "INTERNAL",
          message: "We could not upload your avatar. Please try again.",
        });
      }

      const { data } = ctx.supabase.storage
        .from("avatars")
        .getPublicUrl(avatarPath);
      avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    }

    const profileUpdate = {
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      marketing_consent: parsedInput.marketingConsent,
      name: parsedInput.name,
    };
    const { error: profileError } = await ctx.supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("profile_id", ctx.userId);

    if (profileError) {
      returnAppError({
        code: "INTERNAL",
        message: "We could not update your profile. Please try again.",
      });
    }

    const { error: metadataError } = await ctx.supabase.auth.updateUser({
      data: {
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        display_name: parsedInput.name,
        marketing_consent: parsedInput.marketingConsent,
        name: parsedInput.name,
      },
    });

    if (metadataError) {
      returnAppError({
        code: "INTERNAL",
        message:
          "Your profile was saved, but account metadata could not be synchronized.",
      });
    }

    revalidatePath(localizePath(parsedInput.locale, "/account"));
    revalidatePath(localizePath(parsedInput.locale, "/dashboard"));
    return { avatarUrl: avatarUrl ?? null, success: true };
  });

export const changeEmailAction = authenticatedActionClient
  .inputSchema(changeEmailSchema)
  .action(async ({ parsedInput, ctx }) => {
    const confirmPath = localizePath(parsedInput.locale, "/auth/confirm");
    const verifiedPath = localizePath(
      parsedInput.locale,
      "/auth/email-verified",
    );
    const emailRedirectTo = new URL(
      `${confirmPath}?next=${encodeURIComponent(verifiedPath)}`,
      getSiteUrl(),
    ).toString();
    const { error } = await ctx.supabase.auth.updateUser(
      { email: parsedInput.email },
      { emailRedirectTo },
    );

    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "We could not start the email change. Please try again.",
      });
    }

    return { success: true };
  });

export const changePasswordAction = authenticatedActionClient
  .inputSchema(changePasswordSchema)
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

export const connectProviderAction = authenticatedActionClient
  .inputSchema(providerSchema)
  .action(async ({ parsedInput, ctx }) => {
    const callbackPath = localizePath(
      parsedInput.locale,
      "/auth/social/callback",
    );
    const accountPath = localizePath(parsedInput.locale, "/account");
    const redirectTo = new URL(
      `${callbackPath}?next=${encodeURIComponent(accountPath)}`,
      getSiteUrl(),
    ).toString();
    const { data, error } = await ctx.supabase.auth.linkIdentity({
      provider: parsedInput.provider,
      options: { redirectTo },
    });

    if (error || !data.url) {
      returnAppError({
        code: "AUTH_FAILED",
        message: `We could not connect ${parsedInput.provider}.`,
      });
    }

    return { url: data.url };
  });

export const disconnectProviderAction = authenticatedActionClient
  .inputSchema(providerSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data, error: identitiesError } =
      await ctx.supabase.auth.getUserIdentities();
    const identity = data?.identities.find(
      (candidate) => candidate.provider === parsedInput.provider,
    );

    if (identitiesError || !identity) {
      returnAppError({
        code: "AUTH_FAILED",
        message: "That identity is not connected.",
      });
    }

    if (data.identities.length < 2) {
      returnAppError({
        code: "AUTH_FAILED",
        message:
          "Connect another sign-in method before disconnecting this one.",
      });
    }

    const { error } = await ctx.supabase.auth.unlinkIdentity(identity);
    if (error) {
      returnAppError({
        code: "AUTH_FAILED",
        message: `We could not disconnect ${parsedInput.provider}.`,
      });
    }

    revalidatePath(localizePath(parsedInput.locale, "/account"));
    return { success: true };
  });

export const deleteAccountAction = authenticatedActionClient
  .inputSchema(deleteAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(ctx.userId);

    if (error) {
      returnAppError({
        code: "INTERNAL",
        message: "We could not delete your account. Please try again.",
      });
    }

    const { error: cleanupError } = await admin.storage
      .from("avatars")
      .remove([ctx.userId, `${ctx.userId}/avatar`]);
    if (cleanupError) {
      Sentry.captureException(cleanupError, {
        tags: { operation: "delete-account-avatar" },
      });
    }

    await ctx.supabase.auth.signOut();
    return { locale: parsedInput.locale, success: true };
  });
