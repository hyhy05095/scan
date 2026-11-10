import { expect, test } from "@playwright/test";

test("keeps an unprefixed route and applies the preferred locale", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Supanext" })).toBeVisible();
});

test("switches among every locale and persists the selection without changing URLs", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("lang-switcher").click();
  await page.getByRole("menuitem", { name: /Spanish/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveURL(/\/$/);

  await page.getByTestId("lang-switcher").click();
  await page.getByRole("menuitem", { name: /Coreano/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page).toHaveURL(/\/$/);

  await page.getByTestId("lang-switcher").click();
  await page.getByRole("menuitem", { name: /영어/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.getByTestId("lang-switcher").click();
  await page.getByRole("menuitem", { name: /Spanish/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveURL(/\/$/);
});

test("strips a legacy locale prefix, preserves its query, and saves the locale cookie", async ({
  page,
  context,
}) => {
  await page.goto("/ko/blog?source=legacy");
  await expect(page).toHaveURL(/\/blog\?source=legacy$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  expect(
    (await context.cookies()).find((cookie) => cookie.name === "locale")?.value,
  ).toBe("ko");
  await page.goto("/contact");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page).toHaveURL(/\/contact$/);
});

test("applies light and dark modes and persists the selection", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("theme-switcher").click();
  await page.getByRole("menuitem", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByTestId("theme-switcher").click();
  await page.getByRole("menuitem", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("links signup consent to the original editable MDX legal templates", async ({
  page,
}) => {
  await page.goto("/ko/join");
  const terms = page.getByRole("main").getByRole("link", {
    name: "서비스 이용약관",
    exact: true,
  });
  const privacy = page.getByRole("main").getByRole("link", {
    name: "개인정보 처리방침",
    exact: true,
  });
  await expect(terms).toHaveAttribute("href", "/legal/terms-of-service");
  await expect(privacy).toHaveAttribute("href", "/legal/privacy-policy");

  await terms.click();
  await expect(
    page.getByRole("heading", { name: "Terms Of Service", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "1. Introduction", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "2. Acceptance of Terms", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A small example", exact: true }),
  ).toBeVisible();

  await page.goto("/legal/privacy-policy");
  await expect(
    page.getByRole("heading", { name: "Privacy Policy", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "2. Information We Collect",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "2.1. Personal Information",
      exact: true,
    }),
  ).toBeVisible();
});
