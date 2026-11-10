"use server";

import { actionClient } from "@/lib/safe-action";

import { isSentryDebugEnabled } from "./config";

export const triggerSentryErrorAction = actionClient.action(async () => {
  if (!isSentryDebugEnabled()) {
    return { enabled: false };
  }

  throw new Error("This is a Supanext test error; it should appear in Sentry.");
});
