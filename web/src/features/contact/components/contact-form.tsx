"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { type BoundTurnstileObject, Turnstile } from "react-turnstile";

import { Button } from "@/components/ui/button";

import { FieldError } from "@/features/auth/components/field-error";
import { contactAction } from "@/features/contact/actions";
import type { ContactLabels } from "@/features/contact/types";

const fieldClassName =
  "w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function ContactForm({
  hcaptchaSiteKey,
  labels,
  turnstileSiteKey,
}: {
  hcaptchaSiteKey?: string;
  labels: ContactLabels;
  turnstileSiteKey?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const hcaptchaRef = useRef<HCaptcha>(null);
  const turnstileRef = useRef<BoundTurnstileObject | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const configured = Boolean(hcaptchaSiteKey && turnstileSiteKey);

  const resetCaptchas = () => {
    hcaptchaRef.current?.resetCaptcha();
    turnstileRef.current?.reset();
    setHcaptchaToken("");
    setTurnstileToken("");
  };

  const { execute, isPending, result } = useAction(contactAction, {
    onSettled() {
      resetCaptchas();
    },
    onSuccess({ data }) {
      if (!data.success) return;
      formRef.current?.reset();
      setSubmissionId(crypto.randomUUID());
    },
  });

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        execute({
          email: String(formData.get("email") ?? ""),
          hcaptchaToken,
          message: String(formData.get("message") ?? ""),
          name: String(formData.get("name") ?? ""),
          submissionId,
          turnstileToken,
        });
      }}
      ref={formRef}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          {labels.name}
        </label>
        <input
          aria-invalid={Boolean(result.validationErrors?.name)}
          autoComplete="name"
          className={`${fieldClassName} h-10`}
          id="name"
          name="name"
          placeholder={labels.namePlaceholder}
          type="text"
        />
        <FieldError errors={result.validationErrors?.name?._errors} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          {labels.email}
        </label>
        <input
          aria-invalid={Boolean(result.validationErrors?.email)}
          autoComplete="email"
          className={`${fieldClassName} h-10`}
          id="email"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
        <FieldError errors={result.validationErrors?.email?._errors} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="message">
          {labels.message}
        </label>
        <textarea
          aria-invalid={Boolean(result.validationErrors?.message)}
          className={`${fieldClassName} min-h-36 resize-y py-3`}
          id="message"
          name="message"
          placeholder={labels.messagePlaceholder}
        />
        <FieldError errors={result.validationErrors?.message?._errors} />
      </div>

      {hcaptchaSiteKey && turnstileSiteKey ? (
        <div className="grid items-start gap-5 md:grid-cols-2">
          <div className="min-w-0 overflow-hidden rounded-lg border p-3">
            <p className="text-muted-foreground mb-3 text-xs font-medium">
              hCaptcha
            </p>
            <HCaptcha
              onChalExpired={() => setHcaptchaToken("")}
              onError={() => setHcaptchaToken("")}
              onExpire={() => setHcaptchaToken("")}
              onVerify={setHcaptchaToken}
              ref={hcaptchaRef}
              sitekey={hcaptchaSiteKey}
            />
            <FieldError
              errors={result.validationErrors?.hcaptchaToken?._errors}
            />
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border p-3">
            <p className="text-muted-foreground mb-3 text-xs font-medium">
              Cloudflare Turnstile
            </p>
            <Turnstile
              onError={() => setTurnstileToken("")}
              onExpire={() => setTurnstileToken("")}
              onSuccess={setTurnstileToken}
              action="contact"
              language="auto"
              theme="auto"
              onLoad={(_, bound) => {
                turnstileRef.current = bound;
              }}
              sitekey={turnstileSiteKey}
            />
            <FieldError
              errors={result.validationErrors?.turnstileToken?._errors}
            />
          </div>
        </div>
      ) : (
        <p
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"
          role="status"
        >
          {labels.configurationRequired}
        </p>
      )}

      <p className="text-muted-foreground text-center text-sm">
        {labels.captchaNote}
      </p>

      {result.serverError ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          role="alert"
        >
          {result.serverError.message}
        </p>
      ) : null}
      {result.data ? (
        <p
          className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          {labels.success}
        </p>
      ) : null}

      <Button
        className="h-10 w-full"
        disabled={!configured || !hcaptchaToken || !turnstileToken || isPending}
        type="submit"
      >
        {isPending ? labels.sending : labels.send}
      </Button>
    </form>
  );
}
