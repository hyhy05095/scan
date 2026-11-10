import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createTestEmail,
  deleteUser,
  findUser,
  followTokenLink,
  generateAuthToken,
  loginUser,
  logoutUser,
  requireHostedAdminConfig,
} from "../utils/test-helpers";

test.describe.serial("Hosted secure email-change flow", () => {
  let currentEmail = "";
  let newEmail = "";
  const password = "Password123!";

  test.beforeAll(async ({}, workerInfo) => {
    requireHostedAdminConfig();
    currentEmail = createTestEmail("email-current", workerInfo.project.name);
    newEmail = createTestEmail("email-new", workerInfo.project.name);
    await createConfirmedUser(currentEmail, password);
  });

  test.afterAll(async () => {
    await deleteUser(currentEmail);
    await deleteUser(newEmail);
  });

  test("validates, confirms both addresses, and accepts the new login", async ({
    page,
  }) => {
    await loginUser(page, currentEmail, password);
    await page.goto("/account/edit");
    await expect(page.getByLabel("Current email")).toBeDisabled();
    await expect(page.getByLabel("Current email")).toHaveValue(currentEmail);

    await page.getByRole("button", { name: "Change email" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await page.getByLabel("New email").fill("invalid-email");
    await page.getByRole("button", { name: "Change email" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();

    await page.getByLabel("New email").fill(newEmail);
    await page.getByRole("button", { name: "Change email" }).click();
    await expect(
      page.getByText("Check your inbox to complete the email change."),
    ).toBeVisible();
    await expect(page.getByLabel("New email")).toHaveValue("");

    const currentToken = await generateAuthToken({
      email: currentEmail,
      newEmail,
      type: "email_change_current",
    });
    const newToken = await generateAuthToken({
      email: currentEmail,
      newEmail,
      type: "email_change_new",
    });

    await followTokenLink(
      page,
      currentToken,
      "email_change",
      "/auth/email-verified",
    );
    await expect(
      page.getByRole("heading", { name: "Email confirmation complete" }),
    ).toBeVisible();
    await followTokenLink(
      page,
      newToken,
      "email_change",
      "/auth/email-verified",
    );
    await expect(
      page.getByRole("heading", { name: "Email confirmation complete" }),
    ).toBeVisible();

    await expect.poll(async () => findUser(newEmail)).not.toBeNull();
    await page.goto("/dashboard");
    await logoutUser(page, newEmail);
    await loginUser(page, newEmail, password);
  });
});
