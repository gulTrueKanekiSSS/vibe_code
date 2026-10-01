import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, SignJWT } from "jose";
import { verifyTelegramToken } from "../src/lib/telegram";
test("Telegram JWT verification requires signature, issuer, audience, time and numeric identity", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  async function token(overrides: Record<string, unknown> = {}) {
    return new SignJWT({
      id: 12345,
      sub: "subject",
      iss: "https://oauth.telegram.org",
      aud: "client",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      ...overrides,
    })
      .setProtectedHeader({ alg: "RS256" })
      .sign(privateKey);
  }
  assert.equal(
    (await verifyTelegramToken(await token(), "client", publicKey)).id,
    12345,
  );
  await assert.rejects(
    verifyTelegramToken(
      await token({ iss: "https://evil.example" }),
      "client",
      publicKey,
    ),
  );
  await assert.rejects(
    verifyTelegramToken(await token({ aud: "other" }), "client", publicKey),
  );
  await assert.rejects(
    verifyTelegramToken(await token({ exp: 1 }), "client", publicKey),
  );
  await assert.rejects(
    verifyTelegramToken(await token({ id: null }), "client", publicKey),
  );
  await assert.rejects(
    verifyTelegramToken(await token({ sub: "" }), "client", publicKey),
  );
  const wrong = await generateKeyPair("RS256");
  await assert.rejects(
    verifyTelegramToken(await token(), "client", wrong.publicKey),
  );
});
