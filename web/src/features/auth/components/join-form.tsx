"use client";

import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { joinAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

import { FieldError } from "./field-error";
import { OAuthButtons } from "./oauth-buttons";
import { ResendVerificationButton } from "./resend-verification-button";
import type { AuthLabels } from "./types";

const inputClassName =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function JoinForm({
  labels,
  locale,
}: {
  labels: AuthLabels;
  locale: Locale;
}) {
  const router = useRouter();
  const [checkEmail, setCheckEmail] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { execute, isPending, result } = useAction(joinAction, {
    onSuccess({ data }) {
      if (data.signedIn) {
        router.replace(`/`);
        router.refresh();
        return;
      }

      setCheckEmail(true);
    },
  });

  if (checkEmail) {
    return (
      <div className="space-y-5" role="status">
        <p className="bg-muted rounded-lg p-4 text-sm leading-6">
          {labels.checkEmail}
        </p>
        <ResendVerificationButton
          email={submittedEmail}
          labels={labels}
          locale={locale}
        />
        <Button asChild className="h-10 w-full">
          <Link href={`/login`}>{labels.goToLogin}</Link>
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
        const email = String(formData.get("email") ?? "");
        setSubmittedEmail(email);

        execute({
          name: String(formData.get("name") ?? ""),
          email,
          password: String(formData.get("password") ?? ""),
          confirmPassword: String(formData.get("confirmPassword") ?? ""),
          acceptTerms: formData.get("acceptTerms") === "on",
          marketingConsent: formData.get("marketingConsent") === "on",
          locale,
        });
      }}
    >
      <AuthField
        autoComplete="name"
        errors={result.validationErrors?.name?._errors}
        id="name"
        label={labels.name}
        placeholder="Your name"
      />
      <AuthField
        autoComplete="email"
        errors={result.validationErrors?.email?._errors}
        id="email"
        label={labels.email}
        placeholder="you@example.com"
        type="email"
      />
      <AuthField
        autoComplete="new-password"
        errors={result.validationErrors?.password?._errors}
        id="password"
        label={labels.password}
        type="password"
      />
      <AuthField
        autoComplete="new-password"
        errors={result.validationErrors?.confirmPassword?._errors}
        id="confirmPassword"
        label={labels.confirmPassword}
        type="password"
      />

      <label
        className="flex items-start gap-3 text-sm leading-5"
        htmlFor="acceptTerms"
      >
        <input
          className="mt-0.5 size-4 rounded border"
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
        />
        <span>
          {labels.acceptTermsPrefix}{" "}
          <Link
            className="font-medium underline-offset-4 hover:underline"
            href={`/legal/terms-of-service`}
          >
            {labels.terms}
          </Link>{" "}
          {labels.and}{" "}
          <Link
            className="font-medium underline-offset-4 hover:underline"
            href={`/legal/privacy-policy`}
          >
            {labels.privacy}
          </Link>
          .
        </span>
      </label>
      <FieldError errors={result.validationErrors?.acceptTerms?._errors} />
      <CheckboxField id="marketingConsent" label={labels.marketing} />

      {result.serverError ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          role="alert"
        >
          {result.serverError.message}
        </p>
      ) : null}

      <Button className="h-10 w-full" disabled={isPending} type="submit">
        {isPending ? labels.creatingAccount : labels.createAccount}
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
      <OAuthButtons labels={labels} locale={locale} nextPath={`/`} />

      <p className="text-muted-foreground text-center text-sm">
        {labels.alreadyRegistered}{" "}
        <Link
          className="text-foreground font-medium underline-offset-4 hover:underline"
          href={`/login`}
        >
          {labels.login}
        </Link>
      </p>
    </form>
  );
}

function AuthField({
  errors,
  id,
  label,
  type = "text",
  ...inputProps
}: {
  errors?: string[];
  id: string;
  label: string;
  type?: string;
} & Omit<React.ComponentProps<"input">, "id" | "name" | "type">) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        aria-invalid={Boolean(errors)}
        className={inputClassName}
        id={id}
        name={id}
        type={type}
      />
      <FieldError errors={errors} />
    </div>
  );
}

function CheckboxField({ id, label }: { id: string; label: string }) {
  return (
    <label className="flex items-start gap-3 text-sm leading-5" htmlFor={id}>
      <input
        className="mt-0.5 size-4 rounded border"
        id={id}
        name={id}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}
