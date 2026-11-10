import { expect, test } from "@playwright/test";

test("join validates credentials on the server", async ({ page }) => {
  await page.goto("/join");

  await page.getByLabel("Name").fill("");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("password1");
  await page.getByLabel("Confirm password").fill("different1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Enter your name.")).toBeVisible();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await expect(
    page.getByText("You must accept the terms to create an account."),
  ).toBeVisible();

  await page.getByLabel("Name").fill("김");
  await page.getByLabel("Password", { exact: true }).fill("abcdefgh");
  await page.getByLabel("Confirm password").fill("abcdefgh");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your name.")).toHaveCount(0);
  await expect(page.getByText("Password must include a number.")).toHaveCount(
    0,
  );
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
});

test("login validates missing credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(
    page.getByText("Password must be at least 8 characters."),
  ).toBeVisible();
});

test("password recovery validates the email on the server", async ({
  page,
}) => {
  await page.goto("/auth/forgot-password/reset");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
});

test("the new-password page requires a recovery session", async ({ page }) => {
  await page.goto("/auth/forgot-password/create");

  await expect(page).toHaveURL(/\/auth\/forgot-password\/reset$/);
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
});

test("passwordless login options validate email input", async ({ page }) => {
  await page.goto("/auth/magic-link");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();

  await page.goto("/auth/otp/start");
  await page.getByLabel("Email").fill("still-not-an-email");
  await page.getByRole("button", { name: "Send verification code" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
});

test("OTP verification requires a valid email destination", async ({
  page,
}) => {
  await page.goto("/auth/otp/complete?email=invalid");

  await expect(page).toHaveURL(/\/auth\/otp\/start$/);
});

test("OTP renders six slots and submits automatically after the sixth digit", async ({
  page,
}) => {
  let submissions = 0;
  await page.route("**/auth/otp/complete*", async (route) => {
    if (route.request().method() === "POST") {
      submissions += 1;
      // Verify the UI submission without contacting Supabase or using a real token.
      await route.abort();
    } else {
      await route.continue();
    }
  });
  await page.goto("/auth/otp/complete?email=otp-fixture%40example.com");
  await expect(page.locator('[data-slot="input-otp-slot"]')).toHaveCount(6);
  const code = page.getByLabel("Verification code", { exact: true });
  await code.fill("12345");
  await expect(code).toHaveValue("12345");
  expect(submissions).toBe(0);
  const submission = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      request.url().includes("/auth/otp/complete"),
  );
  await code.fill("123456");
  expect((await submission).postData()).toContain("123456");
  await expect.poll(() => submissions).toBe(1);
});

test("login exposes Supaplate passwordless and social options", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(
    page.getByRole("link", { name: "Email me a magic link" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Use a six-digit code" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with GitHub" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Apple" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Kakao" }),
  ).toBeVisible();
});

test("the dashboard redirects anonymous users to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});

test("an invalid confirmation link fails without redirecting off-site", async ({
  page,
}) => {
  await page.goto("/auth/confirm?next=https://example.com");

  await expect(page).toHaveURL(/\/login\?error=confirmation$/);
});

test("an invalid social callback fails without redirecting off-site", async ({
  page,
}) => {
  await page.goto("/auth/social/callback?next=https://example.com");

  await expect(page).toHaveURL(/\/login\?error=social$/);
});
