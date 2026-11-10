"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <main>
          <title>Something went wrong · Supanext</title>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            500
          </p>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred while loading Supanext.</p>
          <button
            onClick={retry}
            style={{
              border: "1px solid currentColor",
              borderRadius: "0.5rem",
              cursor: "pointer",
              marginTop: "1rem",
              padding: "0.625rem 1rem",
            }}
            type="button"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
