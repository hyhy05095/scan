import * as Sentry from "@sentry/nextjs";

import { processMailerQueue } from "@/features/mailer/queue";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== cronSecret) {
    return Response.json({ success: false }, { status: 401 });
  }

  try {
    const summary = await processMailerQueue();
    const hasFailures = summary.retrying > 0 || summary.deadLettered > 0;
    return Response.json(
      {
        processed: summary.sent + summary.retrying + summary.deadLettered,
        ...summary,
        success: !hasFailures,
      },
      {
        headers: { "Cache-Control": "no-store" },
        status: hasFailures ? 500 : 200,
      },
    );
  } catch (caught) {
    Sentry.captureException(caught, {
      tags: { feature: "mailer", operation: "cron" },
    });
    return Response.json(
      { success: false },
      { headers: { "Cache-Control": "no-store" }, status: 500 },
    );
  }
}
