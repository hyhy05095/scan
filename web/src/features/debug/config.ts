import "server-only";

export function isSentryDebugEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.SENTRY_DEBUG_ENABLED === "true"
  );
}
