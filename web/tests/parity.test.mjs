import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const requireDependency = createRequire(import.meta.url);
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("build keeps type checking and leaves database type generation explicit", () => {
  const { scripts } = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );
  assert.equal(scripts.prebuild, "npm run typecheck");
  assert.equal(scripts.build, "next build");
  assert.equal(scripts["db:typegen"], "node scripts/db-typegen.mjs");
});

// Execute application functions without starting Next.js or contacting providers.
// TypeScript and Zod are real; only explicitly supplied boundary modules are faked.
function loadSource(relativePath, stubs = {}, environment = {}) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const source = fs.readFileSync(filename, "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    const localRequire = (specifier) => {
      if (Object.hasOwn(stubs, specifier)) return stubs[specifier];
      if (specifier === "server-only") return {};
      if (specifier.startsWith("@/") || specifier.startsWith(".")) {
        const base = specifier.startsWith("@/")
          ? path.join(projectRoot, "src", specifier.slice(2))
          : path.resolve(path.dirname(filename), specifier);
        const resolved = [
          base,
          `${base}.ts`,
          `${base}.tsx`,
          `${base}.json`,
        ].find(
          (candidate) =>
            fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
        );
        assert.ok(resolved, `Cannot resolve ${specifier} from ${filename}`);
        return resolved.endsWith(".json")
          ? JSON.parse(fs.readFileSync(resolved))
          : load(resolved);
      }
      return requireDependency(specifier);
    };
    vm.runInNewContext(
      outputText,
      {
        module: loadedModule,
        exports: loadedModule.exports,
        require: localRequire,
        __dirname: path.dirname(filename),
        __filename: filename,
        process: { env: environment, cwd: () => projectRoot },
        File,
        Request,
        Response,
        URL,
        URLSearchParams,
        Buffer,
        console,
      },
      { filename },
    );
    return loadedModule.exports;
  }
  return load(path.join(projectRoot, relativePath));
}

const joinInput = {
  name: "Nico",
  email: "fixture@example.com",
  password: "password1",
  confirmPassword: "password1",
  acceptTerms: true,
  marketingConsent: false,
  locale: "en",
};

function actionBoundary() {
  const client = {
    inputSchema(schema) {
      return {
        action: (handler) => (input) =>
          handler({ parsedInput: schema.parse(input) }),
      };
    },
    action: (handler) => handler,
  };
  return {
    actionClient: client,
    authenticatedActionClient: client,
    returnAppError(error) {
      throw new Error(error.message);
    },
  };
}

test("signup and profile accept a one-character name, as Supaplate does", () => {
  const { joinSchema } = loadSource("src/features/auth/schemas.ts");
  const { updateProfileSchema } = loadSource("src/features/account/schemas.ts");
  assert.equal(
    joinSchema.safeParse({ ...joinInput, name: "김" }).success,
    true,
  );
  assert.equal(
    updateProfileSchema.safeParse({
      name: "김",
      locale: "en",
      marketingConsent: false,
    }).success,
    true,
  );
});

for (const password of ["abcdefgh", "12345678", "a".repeat(100)]) {
  test(`password rules retain the original minimum-only policy (${password.length} characters, ${/^\d+$/.test(password) ? "digits" : "letters"})`, () => {
    const { joinSchema, newPasswordSchema } = loadSource(
      "src/features/auth/schemas.ts",
    );
    const { changePasswordSchema } = loadSource(
      "src/features/account/schemas.ts",
    );
    const input = { password, confirmPassword: password, locale: "en" };
    assert.equal(
      joinSchema.safeParse({ ...joinInput, ...input }).success,
      true,
    );
    assert.equal(newPasswordSchema.safeParse(input).success, true);
    assert.equal(changePasswordSchema.safeParse(input).success, true);
  });
}

test("short passwords and mismatching confirmations still fail", () => {
  const { joinSchema, newPasswordSchema } = loadSource(
    "src/features/auth/schemas.ts",
  );
  assert.equal(
    joinSchema.safeParse({
      ...joinInput,
      password: "short",
      confirmPassword: "short",
    }).success,
    false,
  );
  assert.equal(
    newPasswordSchema.safeParse({
      password: "password1",
      confirmPassword: "different1",
    }).success,
    false,
  );
});

test("contact accepts a one-character name and message", () => {
  const { contactSchema } = loadSource("src/features/contact/schema.ts");
  const input = {
    name: "김",
    message: "Hi",
    email: "fixture@example.com",
    hcaptchaToken: "test-token",
    turnstileToken: "test-token",
    submissionId: "e4d9b6f1-d624-4bc9-941e-8c34c0806f65",
  };
  assert.equal(
    contactSchema.safeParse({ ...input, message: "!" }).success,
    true,
  );
  assert.equal(
    contactSchema.safeParse({ ...input, message: "" }).success,
    false,
  );
});

test("account deletion requires the original two checkboxes, not typed DELETE", () => {
  const { deleteAccountSchema } = loadSource("src/features/account/schemas.ts");
  const input = {
    confirmDeletion: true,
    confirmIrreversible: true,
    locale: "en",
  };
  assert.equal(deleteAccountSchema.safeParse(input).success, true);
  assert.equal(
    deleteAccountSchema.safeParse({ ...input, confirmDeletion: false }).success,
    false,
  );
  assert.equal(
    deleteAccountSchema.safeParse({ ...input, confirmIrreversible: false })
      .success,
    false,
  );
});

function cronModule(environment = { CRON_SECRET: "fixture-secret" }) {
  let processed = 0;
  const route = loadSource(
    "src/app/api/cron/mailer/route.ts",
    {
      "@sentry/nextjs": { captureException() {} },
      "@/features/mailer/queue": {
        async processMailerQueue() {
          processed += 1;
          return { sent: 1, retrying: 0, deadLettered: 0 };
        },
      },
    },
    environment,
  );
  return { route, processed: () => processed };
}

test("Supabase Cron can POST using the raw Authorization secret", async () => {
  const { route, processed } = cronModule();
  assert.equal(
    typeof route.POST,
    "function",
    "Mailer must export a POST route for Supabase Cron",
  );
  const response = await route.POST(
    new Request("https://example.com/api/cron/mailer", {
      method: "POST",
      headers: { Authorization: "fixture-secret" },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(processed(), 1);
});

test("cron rejects Bearer tokens, wrong secrets, and missing secrets without processing", async () => {
  const { route, processed } = cronModule();
  assert.equal(typeof route.POST, "function");
  for (const secret of ["Bearer fixture-secret", "wrong", ""]) {
    const response = await route.POST(
      new Request("https://example.com/api/cron/mailer", {
        method: "POST",
        headers: { Authorization: secret },
      }),
    );
    assert.equal(response.status, 401);
  }
  assert.equal(processed(), 0);
  const unconfigured = cronModule({});
  const response = await unconfigured.route.POST(
    new Request("https://example.com/api/cron/mailer", { method: "POST" }),
  );
  assert.equal(response.status, 401);
  assert.equal(unconfigured.processed(), 0);
});

test("cron does not expose a GET job handler", () => {
  const { route } = cronModule();
  assert.equal(
    route.GET,
    undefined,
    "Supabase Cron uses POST; GET must not trigger email delivery",
  );
});

test("welcome delivery accepts the same long names as signup", async () => {
  const name = "N".repeat(101);
  const { joinSchema } = loadSource("src/features/auth/schemas.ts");
  assert.equal(joinSchema.safeParse({ ...joinInput, name }).success, true);
  const statements = [];
  const sent = [];
  const db = {
    async execute(statement) {
      statements.push(statement);
      if (statements.length === 1)
        return [
          {
            msg_id: "42",
            read_ct: 1,
            message: {
              data: { locale: "en", name },
              eventId: "e4d9b6f1-d624-4bc9-941e-8c34c0806f65",
              template: "welcome",
              to: joinInput.email,
            },
          },
        ];
      return [];
    },
    async transaction() {
      assert.fail("A valid signup name must not be sent to dead letters");
    },
  };
  const { processMailerQueue } = loadSource(
    "src/features/mailer/queue.ts",
    {
      "@sentry/nextjs": { captureException() {} },
      "@/db": { getDb: () => db },
      "@/lib/resend": {
        createResendClient: () => ({
          emails: {
            async send(email) {
              sent.push(email);
              return { error: null };
            },
          },
        }),
      },
      "../../../transactional-emails/emails/welcome": {
        __esModule: true,
        default: ({ profile }) => JSON.parse(profile).name,
      },
    },
    { RESEND_FROM_EMAIL: "Supanext <hello@example.com>" },
  );
  const summary = await processMailerQueue();
  assert.equal(summary.sent, 1);
  assert.equal(summary.deadLettered, 0);
  assert.equal(sent[0].react, name);
  assert.equal(
    statements.length,
    2,
    "Read the queue, then acknowledge delivery",
  );
});

test("signup writes the name metadata consumed by the profile trigger", async () => {
  let signup;
  const accountLookup = { doesUserExist: async () => false };
  const { joinAction } = loadSource("src/features/auth/actions.ts", {
    "@/lib/safe-action": actionBoundary(),
    "@/features/auth/data": accountLookup,
    "./data": accountLookup,
    "@/lib/site-url": {
      getSiteUrl: () => "https://example.com",
      getSafeNextPath: (_, fallback) => fallback,
    },
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          async signUp(input) {
            signup = input;
            return { data: { session: null }, error: null };
          },
        },
      }),
    },
  });
  await joinAction(joinInput);
  assert.equal(signup.options.data.name, joinInput.name);
});

test("signup reports an existing account without submitting another signup", async () => {
  let submitted = false;
  const accountLookup = {
    async doesUserExist(email) {
      return email === joinInput.email;
    },
  };
  const { joinAction } = loadSource("src/features/auth/actions.ts", {
    "@/lib/safe-action": actionBoundary(),
    "@/features/auth/data": accountLookup,
    "./data": accountLookup,
    "@/lib/site-url": {
      getSiteUrl: () => "https://example.com",
      getSafeNextPath: (_, fallback) => fallback,
    },
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          async signUp() {
            submitted = true;
            return { data: { session: null }, error: null };
          },
        },
      }),
    },
  });
  await assert.rejects(() => joinAction(joinInput), /already|existing/i);
  assert.equal(submitted, false);
});

test("logout invalidates all sessions using Supaplate's default global scope", async () => {
  const sessions = new Set(["current-browser", "another-browser"]);
  const supabase = {
    auth: {
      async signOut(options) {
        if (options?.scope === "local") sessions.delete("current-browser");
        else if (options?.scope === "others")
          sessions.delete("another-browser");
        else sessions.clear();
        return { error: null };
      },
    },
  };
  const accountLookup = { doesUserExist: async () => false };
  const { logoutAction } = loadSource("src/features/auth/actions.ts", {
    "@/lib/safe-action": actionBoundary(),
    "@/features/auth/data": accountLookup,
    "./data": accountLookup,
    "@/lib/supabase/server": { createClient: async () => supabase },
    "@/lib/site-url": {
      getSiteUrl: () => "https://example.com",
      getSafeNextPath: (_, fallback) => fallback,
    },
  });
  const result = await logoutAction({ ctx: { supabase } });
  assert.equal(result.success, true);
  assert.equal(sessions.size, 0);
});

test("browser URLs stay unprefixed regardless of the selected language", () => {
  const { localizePath } = loadSource("src/i18n/config.ts");
  for (const locale of ["en", "es", "ko"]) {
    for (const pathname of [
      "/",
      "/login",
      "/blog",
      "/blog/hello-world",
      "/dashboard",
      "/auth/confirm?next=%2Fdashboard",
    ]) {
      assert.equal(localizePath(locale, pathname), pathname);
    }
  }
});

test("payment history does not silently drop records after the first 100", async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    payment_id: index + 1,
    user_id: "fixture-user",
    order_id: `order-${index}`,
    order_name: "Fixture order",
    total_amount: "1000",
    approved_at: "2026-01-01T00:00:00Z",
    currency: "KRW",
    status: "DONE",
    receipt_url: null,
  }));
  function query(supabase = false) {
    let result = rows;
    const builder = {
      select() {
        return this;
      },
      from() {
        return this;
      },
      where() {
        return this;
      },
      eq() {
        return this;
      },
      order() {
        return this;
      },
      orderBy() {
        return this;
      },
      limit(count) {
        result = result.slice(0, count);
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve(
          supabase ? { data: result, error: null } : result,
        ).then(resolve, reject);
      },
    };
    return builder;
  }
  const { getPaymentHistory } = loadSource("src/features/payments/data.ts", {
    "@/db": { getDb: () => query() },
    "@/db/schema": { payments: {}, paymentOrders: {} },
    "drizzle-orm": { eq() {}, and() {}, desc() {} },
    "@/lib/supabase/server": {
      createClient: async () => ({
        from: () => query(true),
        auth: {
          getUser: async () => ({
            data: { user: { id: "fixture-user" } },
            error: null,
          }),
        },
      }),
    },
  });
  const history = await getPaymentHistory("fixture-user");
  assert.equal(history.length, 101);
});

test("adding an MDX file makes its frontmatter discoverable without editing a registry", async () => {
  const fixture = `---
title: A newly added post
description: Discovered from the file itself
date: "2026-06-01"
author: Fixture author
category: Updates
---

This file was not registered in application code.
`;
  const filename = "new-unregistered-post.mdx";
  function readdir(_directory, options) {
    return options?.withFileTypes
      ? [{ name: filename, isFile: () => true, isDirectory: () => false }]
      : [filename];
  }
  function readFile(file) {
    assert.equal(path.basename(String(file)), filename);
    return fixture;
  }
  const fixtureFs = {
    readdirSync: readdir,
    readFileSync: readFile,
    existsSync: () => true,
    statSync: () => ({ isFile: () => true, isDirectory: () => false }),
    promises: {
      readdir: async (...args) => readdir(...args),
      readFile: async (...args) => readFile(...args),
    },
  };
  const { getPost } = loadSource("src/features/blog/posts.ts", {
    fs: fixtureFs,
    "node:fs": fixtureFs,
    "fs/promises": fixtureFs.promises,
    "node:fs/promises": fixtureFs.promises,
  });
  const post = await getPost("new-unregistered-post");
  assert.ok(post, "New MDX files must be discovered without editing posts.ts");
  assert.equal(post.title, "A newly added post");
  assert.equal(post.description, "Discovered from the file itself");
  assert.equal(post.author, "Fixture author");
  assert.equal(post.category, "Updates");
  assert.equal(post.date, "2026-06-01");
});
