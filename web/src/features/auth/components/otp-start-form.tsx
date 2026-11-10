"use client";

import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { requestOtpAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

import { FieldError } from "./field-error";
import type { AuthLabels } from "./types";

const inputClassName =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function OtpStartForm({
  labels,
  locale,
}: {
  labels: AuthLabels;
  locale: Locale;
}) {
  const router = useRouter();
  const { execute, isPending, result } = useAction(requestOtpAction, {
    onSuccess({ data }) {
      router.push(`/auth/otp/complete?email=${encodeURIComponent(data.email)}`);
    },
  });

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        execute({ email: String(formData.get("email") ?? ""), locale });
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
        {isPending ? labels.sendingCode : labels.sendCode}
      </Button>
      <p className="text-center text-sm">
        <Link
          className="font-medium underline-offset-4 hover:underline"
          href={`/login`}
        >
          {labels.backToLogin}
        </Link>
      </p>
    </form>
  );
}
