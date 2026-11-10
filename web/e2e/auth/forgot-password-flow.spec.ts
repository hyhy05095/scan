import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createTestEmail,
  deleteUser,
  followTokenLink,
  generateAuthToken,
  loginUser,
  requireHostedAdminConfig,
} from "../utils/test-helpers";

test.describe("Reset password UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/forgot-password/reset");
  });
  test("shows and validates the reset request form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await page.getByLabel("Email").fill("invalid@email");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });
});

test.describe.serial("Hosted password recovery flow", () => {
  let email = "";
  test.beforeAll(async ({}, workerInfo) => {
    requireHostedAdminConfig();
    email = createTestEmail("recovery", workerInfo.project.name);
    await createConfirmedUser(email, "Password123!");
  });
  test.afterAll(async () => {
    await deleteUser(email);
  });

  test("accepts a recovery token, updates the password, and permits the new login", async ({
    page,
  }) => {
    await page.goto("/auth/forgot-password/reset");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/a reset link is on its way/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel("Email")).toHaveCount(0);

    const token = await generateAuthToken({ email, type: "recovery" });
    await followTokenLink(
      page,
      token,
      "recovery",
      "/auth/forgot-password/create",
    );
    await expect(
      page.getByRole("heading", { name: "Choose a new password" }),
    ).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("NewPassword123!");
    await page
      .getByLabel("Confirm password", { exact: true })
      .fill("NewPassword123!");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(
      page.getByText("Your password has been updated successfully."),
    ).toBeVisible();
    await page.context().clearCookies();
    await loginUser(page, email, "NewPassword123!");
  });
});
