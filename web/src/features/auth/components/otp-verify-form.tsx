"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { verifyOtpAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

import { FieldError } from "./field-error";
import type { AuthLabels } from "./types";

export function OtpVerifyForm({
  email,
  labels,
}: {
  email: string;
  labels: AuthLabels;
  locale: Locale;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { execute, isPending, result } = useAction(verifyOtpAction, {
    onSuccess() {
      router.replace(`/`);
      router.refresh();
    },
  });

  return (
    <form
      ref={formRef}
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        execute({ email, code: String(formData.get("code") ?? "") });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="code">
          {labels.verificationCode}
        </label>
        <InputOTP
          aria-describedby="otp-destination"
          aria-invalid={Boolean(result.validationErrors?.code)}
          autoComplete="one-time-code"
          id="code"
          inputMode="numeric"
          maxLength={6}
          name="code"
          pattern={REGEXP_ONLY_DIGITS}
          disabled={isPending}
          onComplete={() => formRef.current?.requestSubmit()}
        >
          <InputOTPGroup>
            {[0, 1, 2].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {[3, 4, 5].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="text-muted-foreground text-xs" id="otp-destination">
          {email}
        </p>
        <FieldError errors={result.validationErrors?.code?._errors} />
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
        {isPending ? labels.verifyingCode : labels.verifyCode}
      </Button>
    </form>
  );
}
