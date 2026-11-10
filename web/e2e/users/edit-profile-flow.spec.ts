import { expect, test } from "@playwright/test";
import path from "node:path";

import {
  createConfirmedUser,
  createTestEmail,
  deleteUser,
  getAdminClient,
  loginUser,
  requireHostedAdminConfig,
} from "../utils/test-helpers";

test.describe.serial("Hosted profile-edit flow", () => {
  let email = "";
  let userId = "";
  const updatedName = "Supanext Profile";
  const password = "Password123!";

  test.beforeAll(async ({}, workerInfo) => {
    requireHostedAdminConfig();
    email = createTestEmail("profile", workerInfo.project.name);
    const user = await createConfirmedUser(email, password, "Original Name");
    userId = user.id;
  });

  test.afterAll(async () => {
    if (userId) {
      await getAdminClient().storage.from("avatars").remove([userId]);
    }
    await deleteUser(email);
  });

  test("updates name, consent, and avatar in Auth and the profile table", async ({
    page,
  }) => {
    await loginUser(page, email, password);
    await page.goto("/account/edit");

    for (const heading of [
      "Profile",
      "Email address",
      "Change password",
      "Connected accounts",
      "Delete account",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
    for (const provider of ["GitHub", "Kakao"]) {
      await expect(page.getByText(provider, { exact: true })).toBeVisible();
    }
    await expect(page.getByText("Google", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Apple", { exact: true })).toHaveCount(0);

    await page.getByLabel("Name").fill("");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();

    await page.getByLabel("Name").fill("김");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile updated.")).toBeVisible();

    await page
      .getByLabel("Avatar")
      .setInputFiles(path.join(__dirname, "../assets/avatar-test.jpg"));
    await page.getByLabel("Name").fill(updatedName);
    await page.getByLabel("Send me occasional product updates.").check();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByRole("img", { name: "Avatar" })).toBeVisible();

    await expect
      .poll(
        async () => {
          const { data } =
            await getAdminClient().auth.admin.getUserById(userId);
          return data.user?.user_metadata ?? null;
        },
        { timeout: 15_000 },
      )
      .toMatchObject({
        display_name: updatedName,
        marketing_consent: true,
        name: updatedName,
      });

    const { data: authData, error: authError } =
      await getAdminClient().auth.admin.getUserById(userId);
    expect(authError).toBeNull();
    if (!authData.user)
      throw new Error("Supabase did not return the updated test user.");
    expect(authData.user.user_metadata).toMatchObject({
      display_name: updatedName,
      marketing_consent: true,
      name: updatedName,
    });
    expect(authData.user.user_metadata.avatar_url).toContain(
      `/storage/v1/object/public/avatars/${userId}`,
    );

    const { data: profile, error: profileError } = await getAdminClient()
      .from("profiles")
      .select("avatar_url, marketing_consent, name")
      .eq("profile_id", userId)
      .single();
    expect(profileError).toBeNull();
    expect(profile).toMatchObject({
      marketing_consent: true,
      name: updatedName,
    });
    expect(profile?.avatar_url).toContain(
      `/storage/v1/object/public/avatars/${userId}`,
    );
  });
});
