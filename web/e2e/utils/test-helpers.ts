import { type Page, expect } from "@playwright/test";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import postgres from "postgres";

import type { Database } from "../../src/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdminKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const testEmailVariables = {
  join: "JOIN_TEST_UNCONFIRMED_USER_EMAIL",
  confirm: "JOIN_TEST_UNCONFIRMED_USER_EMAIL",
  existing: "JOIN_TEST_EXISTING_USER_EMAIL",
  login: "LOGIN_TEST_USER_EMAIL",
  "login-unconfirmed": "JOIN_TEST_UNCONFIRMED_USER_EMAIL",
  recovery: "FORGOT_PASSWORD_TEST_USER_EMAIL",
  magic: "MAGIC_LINK_TEST_USER_EMAIL",
  "magic-missing": "MAGIC_LINK_TEST_USER_EMAIL",
  "magic-unconfirmed": "MAGIC_LINK_TEST_USER_EMAIL",
  "email-current": "CHANGE_EMAIL_TEST_USER_EMAIL",
  "email-new": "CHANGE_EMAIL_TEST_USER_NEW_EMAIL",
  password: "CHANGE_PASSWORD_TEST_USER_EMAIL",
  profile: "EDIT_PROFILE_TEST_USER_EMAIL",
  delete: "DELETE_PROFILE_TEST_USER_EMAIL",
} as const;

export function requireHostedAdminConfig() {
  if (!supabaseUrl || !supabaseAdminKey) {
    throw new Error(
      "Hosted E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY). Use --grep-invert Hosted to run public tests only.",
    );
  }
}

let adminClient: SupabaseClient<Database> | undefined;
let testDatabase: ReturnType<typeof postgres> | undefined;

export function getAdminClient() {
  requireHostedAdminConfig();
  if (!supabaseUrl || !supabaseAdminKey) {
    throw new Error(
      "Hosted E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.",
    );
  }

  adminClient ??= createClient<Database>(supabaseUrl, supabaseAdminKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return adminClient;
}

function getTestDatabase() {
  if (testDatabase) return testDatabase;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "Hosted email-change tests require DATABASE_URL to read the generated confirmation tokens.",
    );
  }
  testDatabase = postgres(databaseUrl, {
    idle_timeout: 5,
    max: 1,
    prepare: false,
  });
  return testDatabase;
}

export function createTestEmail(
  label: keyof typeof testEmailVariables,
  projectName: string,
) {
  const variable = testEmailVariables[label];
  const configuredEmail = process.env[variable]?.trim();
  if (!configuredEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail)) {
    throw new Error(
      `Hosted ${label} tests require a dedicated test email in ${variable}.`,
    );
  }
  const [localPart, domain] = configuredEmail.split("@");
  const safeProject = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // Use dedicated configured mailboxes, with stable plus aliases to isolate
  // parallel browsers and scenarios. Their mail provider must support plus addressing.
  return `${localPart}+${label}-${safeProject}@${domain}`;
}

export async function createConfirmedUser(
  email: string,
  password: string,
  name = "Test User",
) {
  await deleteUser(email);
  const { data, error } = await getAdminClient().auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      display_name: name,
      locale: "en",
      marketing_consent: false,
      name,
    },
  });
  if (error) throw error;
  return data.user;
}

export async function createUnconfirmedUser(
  email: string,
  password: string,
  name = "Test User",
) {
  await deleteUser(email);
  const { data, error } = await getAdminClient().auth.admin.createUser({
    email,
    email_confirm: false,
    password,
    user_metadata: {
      display_name: name,
      locale: "en",
      marketing_consent: false,
      name,
    },
  });
  if (error) throw error;
  return data.user;
}

export async function findUser(email: string) {
  const admin = getAdminClient();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
    );
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
  return null;
}

export async function deleteUser(email: string) {
  if (!email) return;
  const user = await findUser(email);
  if (!user) return;
  const { error } = await getAdminClient().auth.admin.deleteUser(user.id);
  if (error) throw error;
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
}

export async function logoutUser(page: Page, email: string) {
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const dashboardMenu = page.getByRole("button", {
    name: new RegExp(escapedEmail, "i"),
  });
  if (await dashboardMenu.count()) {
    await dashboardMenu.click();
  } else {
    await page.getByRole("button", { name: /account menu/i }).click();
  }
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function generateAuthToken(
  params:
    | { email: string; password: string; type: "signup" }
    | { email: string; type: "magiclink" | "recovery" }
    | {
        email: string;
        newEmail: string;
        type: "email_change_current" | "email_change_new";
      },
) {
  if ("newEmail" in params) {
    const column =
      params.type === "email_change_current"
        ? "email_change_token_current"
        : "email_change_token_new";
    const rows = await getTestDatabase().unsafe<
      {
        email_change_token_current: string | null;
        email_change_token_new: string | null;
      }[]
    >(
      `SELECT email_change_token_current, email_change_token_new
       FROM auth.users
       WHERE email = $1`,
      [params.email],
    );
    const token = rows[0]?.[column];
    if (!token) {
      throw new Error(`Supabase did not create ${column} for ${params.email}.`);
    }
    return token;
  }

  const { data, error } =
    await getAdminClient().auth.admin.generateLink(params);
  if (error) throw error;
  return data.properties.hashed_token;
}

export async function followTokenLink(
  page: Page,
  tokenHash: string,
  type: "email" | "email_change" | "recovery",
  next: string,
) {
  await page.goto(
    `/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${type}&next=${encodeURIComponent(next)}`,
  );
}
