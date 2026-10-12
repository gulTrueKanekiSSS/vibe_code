import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hostingErrors } from "../scripts/hosting-config";
import { getTutorProvider } from "../src/lib/tutor/provider";

const valid = {
  NEXT_PUBLIC_APP_URL: "https://studyspace.vercel.app",
  DATABASE_URL:
    "postgresql://user:TEST_SECRET@ep-demo-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  TELEGRAM_CLIENT_ID: "test-client",
  TELEGRAM_CLIENT_SECRET: "TEST_SECRET",
  DEV_AUTH: "false",
  TUTOR_PROVIDER: "disabled",
};

test("hosting accepts isolated HTTPS environments and rejects unsafe config without leaking values", () => {
  assert.deepEqual(hostingErrors(valid), []);
  assert.ok(hostingErrors({}).length >= 6);
  for (const [key, values] of Object.entries({
    NEXT_PUBLIC_APP_URL: [
      "http://localhost:3000",
      "https://localhost",
      "https://127.0.0.1",
      "https://studyspace.vercel.app/",
      "https://user:TEST_SECRET@studyspace.vercel.app",
      "https://studyspace.vercel.app/path",
    ],
    DATABASE_URL: [
      "TEST_SECRET",
      "postgresql://user:TEST_SECRET@localhost:5433/study",
      valid.DATABASE_URL.replace("-pooler", ""),
      valid.DATABASE_URL.replace("require", "disable"),
    ],
    DEV_AUTH: ["true", ""],
    TUTOR_PROVIDER: ["openai", "yandex", ""],
    TELEGRAM_CLIENT_ID: ["", " "],
    TELEGRAM_CLIENT_SECRET: ["", " "],
    NEXT_PUBLIC_API_KEY: ["TEST_SECRET"],
  })) {
    for (const value of values) {
      const errors = hostingErrors({ ...valid, [key]: value });
      assert.ok(errors.length, key);
      assert.ok(!errors.join(" ").includes("TEST_SECRET"));
    }
  }
});

test("disabled Tutor cannot instantiate a paid provider even with credentials", () => {
  const names = [
    "TUTOR_PROVIDER",
    "OPENAI_API_KEY",
    "TUTOR_MODEL",
    "TUTOR_EMBEDDING_MODEL",
    "YANDEX_API_KEY",
    "YANDEX_FOLDER_ID",
  ];
  const previous = names.map((name) => process.env[name]);
  try {
    for (const name of names) process.env[name] = "test-value";
    process.env.TUTOR_PROVIDER = "disabled";
    assert.equal(getTutorProvider(), null);
  } finally {
    names.forEach((name, i) => {
      if (previous[i] === undefined) delete process.env[name];
      else process.env[name] = previous[i];
    });
  }
});

test("Vercel build checks config and generates Prisma without migrating or seeding", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(config.buildCommand, "npm run build:hosting");
  assert.equal(config.installCommand, "npm ci");
  assert.equal(
    pkg.scripts["build:hosting"],
    "npm run hosting:check && npm run db:generate && npm run build",
  );
  assert.equal(pkg.scripts["db:generate"], "prisma generate");
  assert.equal(pkg.scripts.build, "next build --webpack");
});
