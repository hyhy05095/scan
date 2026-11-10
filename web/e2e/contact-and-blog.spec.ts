import { expect, test } from "@playwright/test";

test("renders localized blog index and MDX article", async ({ page }) => {
  await page.goto("/es/blog");

  await expect(
    page.getByRole("heading", { name: "Blog", exact: true }),
  ).toBeVisible();
  const article = page.getByRole("link", { name: /Hello World/ });
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(article).toHaveAttribute("href", "/blog/hello-world");
  await article.click();
  await expect(
    page.getByRole("heading", { name: "Hello World" }),
  ).toBeVisible();
  await expect(page.locator("output")).toHaveText("0");
  await page.getByRole("button", { name: "Increment", exact: true }).click();
  await expect(page.locator("output")).toHaveText("1");
  await page.getByRole("button", { name: "Decrement", exact: true }).click();
  await expect(page.locator("output")).toHaveText("0");
});

test("renders the localized contact form", async ({ page }) => {
  await page.goto("/ko/contact");

  await expect(page.getByRole("heading", { name: "문의하기" })).toBeVisible();
  await expect(page.getByLabel("이름")).toBeVisible();
  await expect(page.getByLabel("이메일")).toBeVisible();
  await expect(page.getByLabel("메시지")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "메시지 보내기" }),
  ).toBeDisabled();
});
