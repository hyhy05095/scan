"use client";

import {
  CheckCircle2Icon,
  LoaderCircleIcon,
  PlugIcon,
  XCircleIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  connectProviderAction,
  disconnectProviderAction,
} from "@/features/account/actions";
import type { AccountLabels } from "@/features/account/types";
import {
  type OAuthProvider,
  ProviderLogo,
} from "@/features/auth/components/provider-logo";
import type { Locale } from "@/i18n/config";

const providers: OAuthProvider[] = ["github", "kakao"];

export function ProviderForm({
  connectedProviders,
  labels,
  locale,
}: {
  connectedProviders: (typeof providers)[number][];
  labels: AccountLabels;
  locale: Locale;
}) {
  const router = useRouter();
  const connect = useAction(connectProviderAction, {
    onSuccess({ data }) {
      window.location.assign(data.url);
    },
  });
  const disconnect = useAction(disconnectProviderAction, {
    onSuccess() {
      router.refresh();
    },
  });

  return (
    <div className="space-y-2">
      {providers.map((provider) => {
        const connected = connectedProviders.includes(provider);
        const label =
          provider === "github"
            ? "GitHub"
            : provider === "google"
              ? "Google"
              : provider === "apple"
                ? "Apple"
                : "Kakao";
        const pending = connected
          ? disconnect.isPending && disconnect.input?.provider === provider
          : connect.isPending && connect.input?.provider === provider;

        return (
          <Button
            key={provider}
            className="group flex w-full justify-between sm:w-1/3"
            aria-label={
              (connected ? labels.disconnect : labels.connect) + " " + label
            }
            disabled={connect.isPending || disconnect.isPending}
            onClick={() =>
              connected
                ? disconnect.execute({ locale, provider })
                : connect.execute({ locale, provider })
            }
            type="button"
            variant="outline"
          >
            <span className="flex items-center gap-2">
              <ProviderLogo className="size-4" provider={provider} />
              {label}
            </span>
            {pending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : connected ? (
              <span>
                <CheckCircle2Icon className="size-4 text-green-500 group-hover:hidden" />
                <XCircleIcon className="hidden size-4 text-red-500 group-hover:block" />
              </span>
            ) : (
              <PlugIcon className="size-4" />
            )}
          </Button>
        );
      })}
      {connect.result.serverError ? (
        <p className="text-destructive text-sm" role="alert">
          {connect.result.serverError.message}
        </p>
      ) : null}
      {disconnect.result.serverError ? (
        <p className="text-destructive text-sm" role="alert">
          {disconnect.result.serverError.message}
        </p>
      ) : null}
      {disconnect.result.data ? (
        <p
          className="text-sm text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          {labels.providerDisconnected}
        </p>
      ) : null}
    </div>
  );
}
