import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createTestEmail,
  deleteUser,
  findUser,
  loginUser,
  requireHostedAdminConfig,
} from "../utils/test-helpers";

test.describe.serial("Hosted account-deletion flow", () => {
  let email = "";
  const password = "Password123!";

  test.beforeAll(async ({}, workerInfo) => {
    requireHostedAdminConfig();
    email = createTestEmail("delete", workerInfo.project.name);
    await createConfirmedUser(email, password);
  });

  test.afterAll(async () => {
    await deleteUser(email);
  });

  test("requires every acknowledgement and permanently deletes the user", async ({
    page,
  }) => {
    await loginUser(page, email, password);
    await page.goto("/account/edit");

    await expect(page.getByLabel("Type DELETE to confirm")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Delete account permanently" })
      .click();
    await expect(
      page.getByText("Confirm that you want to delete your account."),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Confirm that you understand this action is irreversible.",
      ),
    ).toBeVisible();

    await page.getByLabel(/I confirm that I want to delete/i).check();
    await page
      .getByLabel(/I understand that this action is irreversible/i)
      .check();
    await page
      .getByRole("button", { name: "Delete account permanently" })
      .click();

    await expect(page).toHaveURL(/\/$/);
    await expect.poll(async () => findUser(email)).toBeNull();
  });
});
