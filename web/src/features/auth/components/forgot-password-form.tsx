"use client";

import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { forgotPasswordAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

import { FieldError } from "./field-error";
import type { AuthLabels } from "./types";

const inputClassName =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function ForgotPasswordForm({
  labels,
  locale,
}: {
  labels: AuthLabels;
  locale: Locale;
}) {
  const [sent, setSent] = useState(false);
  const { execute, isPending, result } = useAction(forgotPasswordAction, {
    onSuccess() {
      setSent(true);
    },
  });

  if (sent) {
    return (
      <div className="space-y-5" role="status">
        <p className="bg-muted rounded-lg p-4 text-sm leading-6">
          {labels.resetLinkSent}
        </p>
        <Button asChild className="h-10 w-full" variant="outline">
          <Link href={`/login`}>{labels.backToLogin}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        execute({
          email: String(formData.get("email") ?? ""),
          locale,
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

      {result.serverError ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          role="alert"
        >
          {result.serverError.message}
        </p>
      ) : null}

      <Button className="h-10 w-full" disabled={isPending} type="submit">
        {isPending ? labels.sendingResetLink : labels.sendResetLink}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link
          className="text-foreground font-medium underline-offset-4 hover:underline"
          href={`/login`}
        >
          {labels.backToLogin}
        </Link>
      </p>
    </form>
  );
}
