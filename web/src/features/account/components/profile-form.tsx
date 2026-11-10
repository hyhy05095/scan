"use client";

import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { updateProfileAction } from "@/features/account/actions";
import type { AccountLabels } from "@/features/account/types";
import { FieldError } from "@/features/auth/components/field-error";
import type { Locale } from "@/i18n/config";

const inputClassName =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function ProfileForm({
  avatarUrl,
  labels,
  locale,
  marketingConsent,
  name,
}: {
  avatarUrl: string | null;
  labels: AccountLabels;
  locale: Locale;
  marketingConsent: boolean;
  name: string;
}) {
  const [preview, setPreview] = useState(avatarUrl);
  const { execute, isPending, result } = useAction(updateProfileAction);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const avatar = formData.get("avatar");
        execute({
          avatar:
            avatar instanceof File && avatar.size > 0 ? avatar : undefined,
          locale,
          marketingConsent: formData.get("marketingConsent") === "on",
          name: String(formData.get("name") ?? ""),
        });
      }}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="avatar">
            {labels.avatar}
          </label>
          <div className="bg-muted text-muted-foreground relative flex size-24 items-center justify-center overflow-hidden rounded-full border text-2xl font-semibold">
            {preview ? (
              <Image
                alt={labels.avatar}
                className="object-cover"
                fill
                sizes="96px"
                src={preview}
                unoptimized
              />
            ) : (
              name.slice(0, 1).toUpperCase()
            )}
          </div>
        </div>
        <div className="text-muted-foreground flex flex-col gap-2 text-sm sm:w-1/2">
          <p id="avatar-help">{labels.avatarHelp}</p>
          <input
            accept="image/png,image/jpeg,image/gif,image/webp"
            aria-describedby="avatar-help"
            aria-invalid={Boolean(result.validationErrors?.avatar)}
            className={inputClassName}
            id="avatar"
            name="avatar"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
            type="file"
          />
          <FieldError errors={result.validationErrors?.avatar?._errors} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          {labels.name}
        </label>
        <input
          aria-invalid={Boolean(result.validationErrors?.name)}
          autoComplete="name"
          className={inputClassName}
          defaultValue={name}
          id="name"
          name="name"
          type="text"
        />
        <FieldError errors={result.validationErrors?.name?._errors} />
      </div>
      <label
        className="flex items-start gap-3 text-sm leading-5"
        htmlFor="marketingConsent"
      >
        <input
          className="mt-0.5 size-4 rounded border"
          defaultChecked={marketingConsent}
          id="marketingConsent"
          name="marketingConsent"
          type="checkbox"
        />
        <span>{labels.marketingConsent}</span>
      </label>
      <ActionFeedback result={result} success={labels.profileSaved} />
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? labels.savingProfile : labels.saveProfile}
      </Button>
    </form>
  );
}

function ActionFeedback({
  result,
  success,
}: {
  result: { data?: unknown; serverError?: { message: string } };
  success: string;
}) {
  if (result.serverError)
    return (
      <p className="text-destructive text-sm" role="alert">
        {result.serverError.message}
      </p>
    );
  if (result.data)
    return (
      <p
        className="text-sm text-emerald-700 dark:text-emerald-400"
        role="status"
      >
        {success}
      </p>
    );
  return null;
}
