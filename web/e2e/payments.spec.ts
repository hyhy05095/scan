import { expect, test } from "@playwright/test";

test("protects checkout and preserves the return destination", async ({
  page,
}) => {
  await page.goto("/payments/checkout");

  await expect(page).toHaveURL(/\/login\?next=%2Fpayments%2Fcheckout$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});

test("protects payment history", async ({ page }) => {
  await page.goto("/dashboard/payments");

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
});

test("shows a bounded payment failure message and retry link", async ({
  page,
}) => {
  await page.goto(
    "/payments/failure?code=USER_CANCEL&message=Payment%20cancelled",
  );

  await expect(
    page.getByRole("heading", { name: "Payment was not completed" }),
  ).toBeVisible();
  await expect(page.getByText("USER_CANCEL")).toBeVisible();
  await expect(page.getByText("Payment cancelled")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to checkout" }),
  ).toHaveAttribute("href", "/payments/checkout");
});

test("rejects an invalid Toss success redirect before confirmation", async ({
  page,
}) => {
  await page.goto("/payments/success?amount=1&orderId=bad&paymentKey=fake");

  await expect(page).toHaveURL(/\/payments\/failure\?/);
  await expect(page.getByText("INVALID_REDIRECT")).toBeVisible();
});
