"use client";

import { useAction } from "next-safe-action/hooks";

import { Button } from "@/components/ui/button";

import { resendVerificationAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

import type { AuthLabels } from "./types";

export function ResendVerificationButton({
  email,
  labels,
  locale,
}: {
  email: string;
  labels: AuthLabels;
  locale: Locale;
}) {
  const { execute, isPending, result } = useAction(resendVerificationAction);

  return (
    <div className="space-y-3">
      <Button
        className="h-10 w-full"
        disabled={isPending}
        onClick={() => execute({ email, locale })}
        type="button"
        variant="outline"
      >
        {isPending ? labels.resendingVerification : labels.resendVerification}
      </Button>
      {result.serverError ? (
        <p className="text-destructive text-sm" role="alert">
          {result.serverError.message}
        </p>
      ) : null}
      {result.data ? (
        <p
          className="text-sm text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          {labels.verificationResent}
        </p>
      ) : null}
    </div>
  );
}
