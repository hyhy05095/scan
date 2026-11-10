"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

import { changeEmailAction } from "@/features/account/actions";
import type { AccountLabels } from "@/features/account/types";
import { FieldError } from "@/features/auth/components/field-error";
import type { Locale } from "@/i18n/config";

const inputClassName =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-60";

export function ChangeEmailForm({
  email,
  labels,
  locale,
}: {
  email: string;
  labels: AccountLabels;
  locale: Locale;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { execute, isPending, result } = useAction(changeEmailAction, {
    onSuccess() {
      formRef.current?.reset();
    },
  });

  return (
    <form
      className="space-y-5"
      noValidate
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        execute({ email: String(formData.get("email") ?? ""), locale });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="currentEmail">
          {labels.currentEmail}
        </label>
        <input
          className={inputClassName}
          disabled
          id="currentEmail"
          type="email"
          value={email}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="newEmail">
          {labels.newEmail}
        </label>
        <input
          aria-invalid={Boolean(result.validationErrors?.email)}
          autoComplete="email"
          className={inputClassName}
          id="newEmail"
          name="email"
          type="email"
        />
        <FieldError errors={result.validationErrors?.email?._errors} />
      </div>
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
          {labels.emailChangeStarted}
        </p>
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? labels.changingEmail : labels.changeEmail}
      </Button>
    </form>
  );
}
