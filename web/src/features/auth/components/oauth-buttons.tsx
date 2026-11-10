"use client";

import { useAction } from "next-safe-action/hooks";

import { Button } from "@/components/ui/button";

import { startOAuthAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";

import {
  type OAuthProvider,
  ProviderLogo,
  oauthProviders,
} from "./provider-logo";
import type { AuthLabels } from "./types";

export function OAuthButtons({
  labels,
  locale,
  nextPath,
}: {
  labels: AuthLabels;
  locale: Locale;
  nextPath: string;
}) {
  const { execute, input, isPending, result } = useAction(startOAuthAction, {
    onSuccess({ data }) {
      window.location.assign(data.url);
    },
  });

  return (
    <div className="space-y-3">
      {oauthProviders.map((provider) => {
        const label = providerLabel(labels, provider);
        return (
          <Button
            className="h-10 w-full"
            disabled={isPending}
            key={provider}
            onClick={() => execute({ locale, next: nextPath, provider })}
            type="button"
            variant="outline"
          >
            <ProviderLogo className="size-4" provider={provider} />
            {isPending && input?.provider === provider ? `${label}…` : label}
          </Button>
        );
      })}
      {result.serverError ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          role="alert"
        >
          {result.serverError.message}
        </p>
      ) : null}
    </div>
  );
}

function providerLabel(labels: AuthLabels, provider: OAuthProvider) {
  if (provider === "apple") return labels.continueWithApple;
  if (provider === "google") return labels.continueWithGoogle;
  if (provider === "github") return labels.continueWithGitHub;
  return labels.continueWithKakao;
}
