"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { deleteAccountAction } from "@/features/account/actions";
import type { AccountLabels } from "@/features/account/types";
import { FieldError } from "@/features/auth/components/field-error";
import type { Locale } from "@/i18n/config";

export function DeleteAccountForm({
  labels,
  locale,
}: {
  labels: AccountLabels;
  locale: Locale;
}) {
  const router = useRouter();
  const { execute, isPending, result } = useAction(deleteAccountAction, {
    onSuccess() {
      router.replace(`/`);
      router.refresh();
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
          confirmDeletion: formData.get("confirmDeletion") === "on",
          confirmIrreversible: formData.get("confirmIrreversible") === "on",
          locale,
        });
      }}
    >
      <label
        className="flex items-start gap-3 text-sm leading-6"
        htmlFor="confirmDeletion"
      >
        <input
          className="mt-1 size-4"
          id="confirmDeletion"
          name="confirmDeletion"
          type="checkbox"
        />
        <span>{labels.confirmDeletion}</span>
      </label>
      <FieldError errors={result.validationErrors?.confirmDeletion?._errors} />
      <label
        className="flex items-start gap-3 text-sm leading-6"
        htmlFor="confirmIrreversible"
      >
        <input
          className="mt-1 size-4"
          id="confirmIrreversible"
          name="confirmIrreversible"
          type="checkbox"
        />
        <span>{labels.confirmIrreversible}</span>
      </label>
      <FieldError
        errors={result.validationErrors?.confirmIrreversible?._errors}
      />
      {result.serverError ? (
        <p className="text-destructive text-sm" role="alert">
          {result.serverError.message}
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={isPending}
        type="submit"
        variant="destructive"
      >
        {isPending ? labels.deletingAccount : labels.deleteAccount}
      </Button>
    </form>
  );
}
