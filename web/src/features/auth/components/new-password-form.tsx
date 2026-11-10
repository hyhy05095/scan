"use client";

import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { newPasswordAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

import { FieldError } from "./field-error";
import type { AuthLabels } from "./types";

const inputClassName =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function NewPasswordForm({
  labels,
}: {
  labels: AuthLabels;
  locale: Locale;
}) {
  const [updated, setUpdated] = useState(false);
  const { execute, isPending, result } = useAction(newPasswordAction, {
    onSuccess() {
      setUpdated(true);
    },
  });

  if (updated) {
    return (
      <div className="space-y-5" role="status">
        <p className="bg-muted rounded-lg p-4 text-sm leading-6">
          {labels.passwordUpdated}
        </p>
        <Button asChild className="h-10 w-full">
          <Link href={`/`}>{labels.continueToDashboard}</Link>
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
          password: String(formData.get("password") ?? ""),
          confirmPassword: String(formData.get("confirmPassword") ?? ""),
        });
      }}
    >
      <PasswordField
        errors={result.validationErrors?.password?._errors}
        id="password"
        label={labels.password}
      />
      <PasswordField
        errors={result.validationErrors?.confirmPassword?._errors}
        id="confirmPassword"
        label={labels.confirmPassword}
      />

      {result.serverError ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          role="alert"
        >
          {result.serverError.message}
        </p>
      ) : null}

      <Button className="h-10 w-full" disabled={isPending} type="submit">
        {isPending ? labels.updatingPassword : labels.updatePassword}
      </Button>
    </form>
  );
}

function PasswordField({
  errors,
  id,
  label,
}: {
  errors?: string[];
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        aria-invalid={Boolean(errors)}
        autoComplete="new-password"
        className={inputClassName}
        id={id}
        name={id}
        type="password"
      />
      <FieldError errors={errors} />
    </div>
  );
}
