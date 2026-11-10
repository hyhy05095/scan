import * as Sentry from "@sentry/nextjs";
import { createSafeActionClient, returnServerError } from "next-safe-action";

import { createClient } from "@/lib/supabase/server";

export type AppServerError =
  | { code: "AUTH_FAILED"; message: string }
  | { code: "EMAIL_NOT_CONFIRMED"; message: string }
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "INTERNAL"; message: string };

export const actionClient = createSafeActionClient({
  handleServerError(error): AppServerError {
    Sentry.captureException(error);

    return {
      code: "INTERNAL",
      message: "Something went wrong. Please try again.",
    };
  },
});

export const returnAppError: (error: AppServerError) => never =
  returnServerError;

export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    returnAppError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to do that.",
    });
  }

  return next({
    ctx: {
      claims: data.claims,
      supabase,
      userId: data.claims.sub,
    },
  });
});
