import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createTestEmail,
  createUnconfirmedUser,
  deleteUser,
  findUser,
  followTokenLink,
  generateAuthToken,
  requireHostedAdminConfig,
} from "../utils/test-helpers";

test.describe("Magic link UI", () => {
  test("renders and validates the form without revealing account existence", async ({
    page,
  }) => {
    await page.goto("/auth/magic-link");
    await expect(
      page.getByRole("heading", { name: "Sign in with a magic link" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Send magic link" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await page.getByLabel("Email").fill("invalid@email");
    await page.getByRole("button", { name: "Send magic link" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });
});

test.describe.serial("Hosted magic link flow", () => {
  let email = "";
  let missingEmail = "";
  let unconfirmedEmail = "";
  test.beforeAll(async ({}, workerInfo) => {
    requireHostedAdminConfig();
    email = createTestEmail("magic", workerInfo.project.name);
    missingEmail = createTestEmail("magic-missing", workerInfo.project.name);
    unconfirmedEmail = createTestEmail(
      "magic-unconfirmed",
      workerInfo.project.name,
    );
    await deleteUser(missingEmail);
    await createConfirmedUser(email, "Password123!");
    await createUnconfirmedUser(unconfirmedEmail, "Password123!");
  });
  test.afterAll(async () => {
    await deleteUser(email);
    await deleteUser(unconfirmedEmail);
  });

  test("requires an existing account before sending a magic link", async ({
    page,
  }) => {
    await page.goto("/auth/magic-link");
    await page.getByLabel("Email").fill(missingEmail);
    await page.getByRole("button", { name: "Send magic link" }).click();
    await expect(
      page.getByText("Create an account before signing in.", { exact: true }),
    ).toBeVisible();
  });

  test("signs an existing user in through a token-hash callback", async ({
    page,
  }) => {
    await page.goto("/auth/magic-link");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send magic link" }).click();
    await expect(
      page.getByText(/a magic sign-in link is on its way/i),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveCount(0);

    const token = await generateAuthToken({ email, type: "magiclink" });
    await followTokenLink(page, token, "email", "/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("confirms an unconfirmed account through its magic link", async ({
    page,
  }) => {
    await page.goto("/auth/magic-link");
    await page.getByLabel("Email").fill(unconfirmedEmail);
    await page.getByRole("button", { name: "Send magic link" }).click();
    await expect(
      page.getByText(/a magic sign-in link is on its way/i),
    ).toBeVisible();
    const token = await generateAuthToken({
      email: unconfirmedEmail,
      type: "magiclink",
    });
    await followTokenLink(page, token, "email", "/");
    await expect(page).toHaveURL(/\/$/);
    await expect
      .poll(async () =>
        Boolean((await findUser(unconfirmedEmail))?.email_confirmed_at),
      )
      .toBe(true);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);
  });
});
