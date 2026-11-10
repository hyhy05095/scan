"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";

import { Button } from "@/components/ui/button";

import { triggerSentryErrorAction } from "@/features/debug/actions";

export function SentryTest({
  enabled,
  labels,
}: {
  enabled: boolean;
  labels: {
    captured: string;
    configurationRequired: string;
    trigger: string;
    triggering: string;
  };
}) {
  const action = useAction(triggerSentryErrorAction);

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <Button
        disabled={!enabled || action.isPending}
        onClick={() => action.execute()}
        type="button"
      >
        {action.isPending ? (
          <>
            <LoaderCircleIcon className="animate-spin" />
            {labels.triggering}
          </>
        ) : (
          labels.trigger
        )}
      </Button>
      {!enabled ? (
        <p className="text-muted-foreground max-w-md text-center text-sm">
          {labels.configurationRequired}
        </p>
      ) : null}
      {action.result.serverError ? (
        <p
          className="text-muted-foreground max-w-md text-center text-sm"
          role="status"
        >
          {labels.captured}
        </p>
      ) : null}
    </div>
  );
}
