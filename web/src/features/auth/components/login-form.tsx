"use client";

import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { loginAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

import { FieldError } from "./field-error";
import { OAuthButtons } from "./oauth-buttons";
import { ResendVerificationButton } from "./resend-verification-button";
import type { AuthLabels } from "./types";

const inputClassName =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function LoginForm({
  labels,
  locale,
  nextPath,
}: {
  labels: AuthLabels;
  locale: Locale;
  nextPath: string;
}) {
  const router = useRouter();
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { execute, isPending, result } = useAction(loginAction, {
    onSuccess({ data }) {
      if (data.success) {
        router.replace(nextPath);
        router.refresh();
      }
    },
  });

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "");
        setSubmittedEmail(email);

        execute({
          email,
          password: String(formData.get("password") ?? ""),
        });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          {labels.email}
        </label>
        <input
          aria-invalid={Boolean(result.validationErrors?.email)}
          autoComplete="email"
          className={inputClassName}
          id="email"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
        <FieldError errors={result.validationErrors?.email?._errors} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium" htmlFor="password">
            {labels.password}
          </label>
          <Link
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            href={`/auth/forgot-password/reset`}
          >
            {labels.forgotPassword}
          </Link>
        </div>
        <input
          aria-invalid={Boolean(result.validationErrors?.password)}
          autoComplete="current-password"
          className={inputClassName}
          id="password"
          name="password"
          type="password"
        />
        <FieldError errors={result.validationErrors?.password?._errors} />
      </div>

      {result.serverError?.code === "EMAIL_NOT_CONFIRMED" ? (
        <div
          className="border-destructive/30 bg-destructive/10 space-y-3 rounded-lg border p-4"
          role="alert"
        >
          <div className="space-y-1">
            <p className="text-destructive text-sm font-semibold">
              {labels.emailNotConfirmedTitle}
            </p>
            <p className="text-muted-foreground text-sm">
              {labels.emailNotConfirmedDescription}
            </p>
          </div>
          <ResendVerificationButton
            email={submittedEmail}
            labels={labels}
            locale={locale}
          />
        </div>
      ) : result.serverError ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          role="alert"
        >
          {result.serverError.message}
        </p>
      ) : null}

      <Button className="h-10 w-full" disabled={isPending} type="submit">
        {isPending ? labels.loggingIn : labels.login}
      </Button>

      <div className="relative py-1" role="separator">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">
            {labels.orContinueWith}
          </span>
        </div>
      </div>

      <OAuthButtons labels={labels} locale={locale} nextPath={nextPath} />

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        <Link
          className="font-medium underline-offset-4 hover:underline"
          href={`/auth/magic-link`}
        >
          {labels.magicLink}
        </Link>
        <Link
          className="font-medium underline-offset-4 hover:underline"
          href={`/auth/otp/start`}
        >
          {labels.emailCode}
        </Link>
      </div>

      <p className="text-muted-foreground text-center text-sm">
        {labels.newHere}{" "}
        <Link
          className="text-foreground font-medium underline-offset-4 hover:underline"
          href={`/join`}
        >
          {labels.createAccount}
        </Link>
      </p>
    </form>
  );
}
