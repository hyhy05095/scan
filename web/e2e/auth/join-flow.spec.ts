import { expect, test } from "@playwright/test";

import {
  createConfirmedUser,
  createTestEmail,
  deleteUser,
  findUser,
  followTokenLink,
  generateAuthToken,
  requireHostedAdminConfig,
} from "../utils/test-helpers";

test.describe("User registration UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/join");
  });

  test("displays the complete registration form and four social providers", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    for (const label of ["Name", "Email", "Password", "Confirm password"])
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: /I accept/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: /product updates/ }),
    ).toBeVisible();
    for (const provider of ["Google", "GitHub", "Apple", "Kakao"])
      await expect(
        page.getByRole("button", { name: `Continue with ${provider}` }),
      ).toBeVisible();
  });

  test("links to login and editable legal documents", async ({ page }) => {
    await expect(
      page.getByRole("main").getByRole("link", { name: "Log in" }),
    ).toHaveAttribute("href", "/login");
    await expect(
      page.getByRole("main").getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", "/legal/terms-of-service");
    await expect(
      page.getByRole("main").getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/legal/privacy-policy");
  });

  test("validates empty, malformed, short, and mismatched credentials", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await page.getByLabel("Name", { exact: true }).fill("Test User");
    await page.getByLabel("Email", { exact: true }).fill("invalid@email");
    await page.getByLabel("Password", { exact: true }).fill("short1");
    await page.getByLabel("Confirm password").fill("different1");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(
      page.getByText("Password must be at least 8 characters."),
    ).toBeVisible();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });
});

test.describe.serial("Hosted user registration flow", () => {
  let signupEmail = "";
  let callbackEmail = "";
  let existingEmail = "";

  test.beforeAll(async ({}, workerInfo) => {
    requireHostedAdminConfig();
    signupEmail = createTestEmail("join", workerInfo.project.name);
    callbackEmail = createTestEmail("confirm", workerInfo.project.name);
    existingEmail = createTestEmail("existing", workerInfo.project.name);
    await deleteUser(signupEmail);
    await deleteUser(callbackEmail);
    await createConfirmedUser(existingEmail, "Password123!");
  });
  test.afterAll(async () => {
    await Promise.all([
      deleteUser(signupEmail),
      deleteUser(callbackEmail),
      deleteUser(existingEmail),
    ]);
  });

  test("reports an existing account without submitting another signup", async ({
    page,
  }) => {
    await page.goto("/join");
    await page.getByLabel("Name", { exact: true }).fill("Existing User");
    await page.getByLabel("Email", { exact: true }).fill(existingEmail);
    await page.getByLabel("Password", { exact: true }).fill("Password123!");
    await page.getByLabel("Confirm password").fill("Password123!");
    await page.getByRole("checkbox", { name: /I accept/ }).check();
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(
      page.getByText("There is an account with this email already."),
    ).toBeVisible();
  });

  test("creates an unconfirmed account with name and consent metadata and resets the form", async ({
    page,
  }) => {
    await page.goto("/join");
    await page.getByLabel("Name", { exact: true }).fill("Registration Test");
    await page.getByLabel("Email", { exact: true }).fill(signupEmail);
    await page.getByLabel("Password", { exact: true }).fill("Password123!");
    await page.getByLabel("Confirm password").fill("Password123!");
    await page.getByRole("checkbox", { name: /I accept/ }).check();
    await page.getByRole("checkbox", { name: /product updates/ }).check();
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page.getByText(/Check your inbox/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
    const user = await findUser(signupEmail);
    expect(user?.user_metadata.marketing_consent).toBe(true);
    expect(user?.user_metadata.name).toBe("Registration Test");
  });

  test("confirms a signup through the Next.js token-hash callback and rejects bad tokens", async ({
    page,
  }) => {
    const token = await generateAuthToken({
      email: callbackEmail,
      password: "Password123!",
      type: "signup",
    });
    await followTokenLink(page, token, "email", "/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await followTokenLink(page, "invalid", "email", "/dashboard");
    await expect(page).toHaveURL(/\/login\?error=confirmation$/);
  });
});
