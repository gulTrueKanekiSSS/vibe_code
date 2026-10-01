import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomToken, hash, cookieOptions, appUrl } from "@/lib/auth";
export async function GET() {
  if (!process.env.TELEGRAM_CLIENT_ID || !process.env.TELEGRAM_CLIENT_SECRET)
    return NextResponse.redirect(new URL("/login?error=config", appUrl()));
  const state = randomToken(),
    verifier = randomToken();
  await db.authChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await db.authChallenge.create({
    data: {
      stateHash: hash(state),
      verifier,
      expiresAt: new Date(Date.now() + 600000),
    },
  });
  (await cookies()).set("telegram_state", state, {
    ...cookieOptions,
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: process.env.TELEGRAM_CLIENT_ID,
    redirect_uri: `${appUrl()}/api/auth/telegram/callback`,
    response_type: "code",
    scope: "openid profile",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  });
  return NextResponse.redirect(`https://oauth.telegram.org/auth?${params}`);
}
