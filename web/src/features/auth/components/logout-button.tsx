"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { logoutAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

export function LogoutButton({
  labels,
}: {
  labels: { logout: string; loggingOut: string };
  locale: Locale;
}) {
  const router = useRouter();
  const { execute, isPending, result } = useAction(logoutAction, {
    onSuccess() {
      router.replace(`/`);
      router.refresh();
    },
  });

  return (
    <div className="space-y-2">
      <Button disabled={isPending} onClick={() => execute()} variant="outline">
        {isPending ? labels.loggingOut : labels.logout}
      </Button>
      {result.serverError ? (
        <p className="text-destructive text-sm" role="alert">
          {result.serverError.message}
        </p>
      ) : null}
    </div>
  );
}
