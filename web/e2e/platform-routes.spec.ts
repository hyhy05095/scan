import { expect, test } from "@playwright/test";

test("sets baseline security headers", async ({ request }) => {
  const response = await request.get("/");

  expect(response.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["permissions-policy"]).toBe(
    "camera=(), geolocation=(), microphone=()",
  );
});

test("publishes robots and unprefixed sitemap entries", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Disallow: /dashboard");
  expect(robotsText).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("/blog/hello-world");
  expect(sitemapText).toContain("/legal/privacy-policy");
  expect(sitemapText).toContain("/contact");
  expect(sitemapText).not.toMatch(/\/(en|es|ko)\//);
});

test("renders a localized authentication error without reflecting unbounded input", async ({
  page,
}) => {
  await page.goto(
    "/es/error?error_code=access_denied&error_description=No%20autorizado",
  );

  await expect(
    page.getByRole("heading", { name: "Error de autenticación" }),
  ).toBeVisible();
  await expect(page.getByText("No autorizado")).toBeVisible();
  await expect(page.getByText("Código de error: access_denied")).toBeVisible();
});

test("renders the debug integration pages with safe configuration states", async ({
  page,
}) => {
  await page.goto("/debug/analytics");
  await expect(
    page.getByRole("heading", { name: "Google Analytics test" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Trigger event" }),
  ).toBeDisabled();

  await page.goto("/ko/debug/sentry");
  await expect(
    page.getByRole("heading", { name: "Sentry 테스트" }),
  ).toBeVisible();
  const sentryButton = page.getByRole("button", { name: "오류 발생" });
  const sentryDebugEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.SENTRY_DEBUG_ENABLED === "true";
  if (sentryDebugEnabled) {
    await expect(sentryButton).toBeEnabled();
  } else {
    await expect(sentryButton).toBeDisabled();
    await expect(page.getByText("SENTRY_DEBUG_ENABLED=true")).toBeVisible();
  }
});

test("renders the localized not-found page", async ({ page }) => {
  await page.goto("/ko/this-route-does-not-exist");

  await expect(
    page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /홈으로 이동/ })).toHaveAttribute(
    "href",
    "/",
  );
});
