import { expect, test } from "@playwright/test";

test("the account page redirects anonymous users to login", async ({
  page,
}) => {
  await page.goto("/account/edit");

  await expect(page).toHaveURL(/\/login\?next=/);
});
