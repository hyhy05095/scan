import { expect, test } from "@playwright/test";

test("rejects unauthenticated mailer cron requests", async ({ request }) => {
  const response = await request.post("/api/cron/mailer");

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({ success: false });
});

test("rejects GET requests instead of exposing a Vercel Cron job", async ({
  request,
}) => {
  const response = await request.get("/api/cron/mailer");
  expect(response.status()).toBe(405);
});

test("rejects an invalid raw cron secret and Bearer authentication", async ({
  request,
}) => {
  for (const authorization of [
    "invalid-test-secret",
    "Bearer invalid-test-secret",
  ]) {
    const response = await request.post("/api/cron/mailer", {
      headers: { Authorization: authorization },
    });
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ success: false });
  }
});
