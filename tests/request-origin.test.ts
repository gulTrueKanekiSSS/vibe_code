import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedRequestOrigin } from "../src/lib/request-origin";

const publicOrigin = "https://study.example";
test("local practice requests work in development with a public Telegram origin", () => {
  for (const local of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ])
    assert.equal(
      isAllowedRequestOrigin(
        local,
        `${local}/api/practice`,
        publicOrigin,
        true,
      ),
      true,
    );
  assert.equal(
    isAllowedRequestOrigin(
      publicOrigin,
      "http://localhost:3000/api/practice",
      publicOrigin,
      true,
    ),
    true,
  );
});
test("origin validation still rejects cross-site, missing and production loopback origins", () => {
  const target = "http://localhost:3000/api/practice";
  for (const origin of [
    null,
    "null",
    "https://evil.example",
    "http://localhost:4000",
    "http://localhost:3000.evil.example",
  ])
    assert.equal(
      isAllowedRequestOrigin(origin, target, publicOrigin, true),
      false,
    );
  assert.equal(
    isAllowedRequestOrigin(
      "http://localhost:3000",
      target,
      publicOrigin,
      false,
    ),
    false,
  );
  assert.equal(
    isAllowedRequestOrigin(publicOrigin, target, publicOrigin, false),
    true,
  );
  assert.equal(
    isAllowedRequestOrigin(
      "https://evil.example",
      "https://evil.example/api/practice",
      publicOrigin,
      true,
    ),
    false,
  );
});
