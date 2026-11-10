"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { CheckCircle2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AnalyticsTest({
  configured,
  labels,
}: {
  configured: boolean;
  labels: {
    configurationRequired: string;
    success: string;
    trigger: string;
  };
}) {
  const [sent, setSent] = useState(false);

  function triggerEvent() {
    if (!configured) {
      return;
    }

    // This is the event signature documented by Next.js for GA4 custom events.
    // https://nextjs.org/docs/app/guides/third-party-libraries#sending-events
    sendGAEvent("event", "test_event", {
      test: "test",
      time: new Date().toISOString(),
    });
    setSent(true);
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <Button disabled={!configured} onClick={triggerEvent} type="button">
        {labels.trigger}
      </Button>
      {!configured ? (
        <p className="text-muted-foreground max-w-md text-center text-sm">
          {labels.configurationRequired}
        </p>
      ) : null}
      {sent ? (
        <p
          className="text-muted-foreground flex items-center gap-2 text-sm"
          role="status"
        >
          <CheckCircle2Icon className="size-4 text-green-600" />
          {labels.success}
        </p>
      ) : null}
    </div>
  );
}
