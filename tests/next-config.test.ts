import { test } from "node:test";
import assert from "node:assert/strict";

test("development assets accept only the configured public tunnel hostname", async () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://example-tunnel.ngrok-free.app";
  try {
    const { default: config } = await import("../next.config");
    assert.deepEqual(config.allowedDevOrigins, [
      "example-tunnel.ngrok-free.app",
    ]);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});
