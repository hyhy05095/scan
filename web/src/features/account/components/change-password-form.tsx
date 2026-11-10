"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

import { changePasswordAction } from "@/features/account/actions";
import type { AccountLabels } from "@/features/account/types";
import { FieldError } from "@/features/auth/components/field-error";
import type { Locale } from "@/i18n/config";

const inputClassName =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function ChangePasswordForm({
  hasPassword,
  labels,
  locale,
}: {
  hasPassword: boolean;
  labels: AccountLabels;
  locale: Locale;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { execute, isPending, result } = useAction(changePasswordAction, {
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
        execute({
          confirmPassword: String(formData.get("confirmPassword") ?? ""),
          locale,
          password: String(formData.get("password") ?? ""),
        });
      }}
    >
      <PasswordField
        errors={result.validationErrors?.password?._errors}
        id="password"
        label={labels.newPassword}
        autoComplete="new-password"
      />
      <PasswordField
        errors={result.validationErrors?.confirmPassword?._errors}
        id="confirmPassword"
        label={labels.confirmNewPassword}
        autoComplete="new-password"
      />
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
          {labels.passwordSaved}
        </p>
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending
          ? labels.updatingPassword
          : hasPassword
            ? labels.changePassword
            : labels.addPassword}
      </Button>
    </form>
  );
}

function PasswordField({
  autoComplete,
  errors,
  id,
  label,
}: {
  autoComplete: string;
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
        autoComplete={autoComplete}
        className={inputClassName}
        id={id}
        name={id}
        type="password"
      />
      <FieldError errors={errors} />
    </div>
  );
}
