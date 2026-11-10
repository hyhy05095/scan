import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createTestEmail,
  deleteUser,
  loginUser,
  logoutUser,
  requireHostedAdminConfig,
} from "../utils/test-helpers";

test.describe.serial("Hosted password-change flow", () => {
  let email = "";
  const currentPassword = "CurrentPassword123!";
  const newPassword = "abcdefgh";

  test.beforeAll(async ({}, workerInfo) => {
    requireHostedAdminConfig();
    email = createTestEmail("password", workerInfo.project.name);
    await createConfirmedUser(email, currentPassword);
  });

  test.afterAll(async () => {
    await deleteUser(email);
  });

  test("validates, changes, clears, and accepts the new password", async ({
    page,
  }) => {
    await loginUser(page, email, currentPassword);
    await page.goto("/account/edit");

    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByLabel("Current password")).toHaveCount(0);
    await expect(
      page.getByText("Password must be at least 8 characters."),
    ).toBeVisible();

    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill("DifferentPassword789!");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();

    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password updated.")).toBeVisible();
    await expect(page.getByLabel("Current password")).toHaveCount(0);
    await expect(page.getByLabel("New password", { exact: true })).toHaveValue(
      "",
    );
    await expect(page.getByLabel("Confirm new password")).toHaveValue("");

    await logoutUser(page, email);
    await loginUser(page, email, newPassword);
  });
});
