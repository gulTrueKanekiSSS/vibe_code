import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
const telegramKeys = createRemoteJWKSet(
  new URL("https://oauth.telegram.org/.well-known/jwks.json"),
);
export async function verifyTelegramToken(
  token: string,
  audience: string,
  key: CryptoKey | JWTVerifyGetKey = telegramKeys,
) {
  const { payload } = await jwtVerify(token, key, {
    issuer: "https://oauth.telegram.org",
    audience,
    algorithms: ["RS256", "ES256"],
    requiredClaims: ["sub", "iat", "exp"],
    maxTokenAge: "1h",
  });
  if (
    !payload.sub ||
    !["string", "number"].includes(typeof payload.id) ||
    !/^[1-9]\d*$/.test(String(payload.id)) ||
    (typeof payload.id === "number" && !Number.isSafeInteger(payload.id))
  )
    throw new Error("Invalid Telegram identity");
  return payload;
}
