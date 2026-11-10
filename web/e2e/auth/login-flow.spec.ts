import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createTestEmail,
  createUnconfirmedUser,
  deleteUser,
  loginUser,
  logoutUser,
  requireHostedAdminConfig,
} from "../utils/test-helpers";

test.describe("User login UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows password, passwordless, social, recovery, and signup choices", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/auth/forgot-password/reset");
    await expect(
      page.getByRole("link", { name: "Email me a magic link" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Use a six-digit code" }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/join");
  });

  test("validates empty credentials and rejects invalid credentials", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(
      page.getByText("Password must be at least 8 characters."),
    ).toBeVisible();
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(
      page.getByText("Password must be at least 8 characters."),
    ).toBeVisible();
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });
});

test.describe.serial("Hosted user login flow", () => {
  let email = "";
  let unconfirmedEmail = "";
  const password = "Password123!";
  test.beforeAll(async ({}, workerInfo) => {
    requireHostedAdminConfig();
    email = createTestEmail("login", workerInfo.project.name);
    unconfirmedEmail = createTestEmail(
      "login-unconfirmed",
      workerInfo.project.name,
    );
    await createConfirmedUser(email, password);
    await createUnconfirmedUser(unconfirmedEmail, password);
  });
  test.afterAll(async () => {
    await Promise.all([deleteUser(email), deleteUser(unconfirmedEmail)]);
  });

  test("offers verification recovery to an unconfirmed account", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(unconfirmedEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByText("Email not confirmed")).toBeVisible();
    await page
      .getByRole("button", { name: "Resend verification email" })
      .click();
    await expect(
      page.getByText(/another verification email is on its way/i),
    ).toBeVisible();
  });

  test("logs in, blocks public-only auth pages, and logs out", async ({
    page,
  }) => {
    await loginUser(page, email, password);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/dashboard");
    await logoutUser(page, email);
  });
});
