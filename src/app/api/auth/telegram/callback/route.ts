import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyTelegramToken } from "@/lib/telegram";
import { db } from "@/lib/db";
import { appUrl, hash, createSession } from "@/lib/auth";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url),
      state = url.searchParams.get("state"),
      code = url.searchParams.get("code");
    const jar = await cookies(),
      expected = jar.get("telegram_state")?.value;
    jar.delete("telegram_state");
    if (!state || !code || !expected || state !== expected)
      throw new Error("Invalid state");
    // Atomic consume: a callback can be used only once, including concurrent requests.
    const challenge = await db.authChallenge.delete({
      where: { stateHash: hash(state) },
    });
    if (challenge.expiresAt < new Date()) throw new Error("Expired");
    const clientId = process.env.TELEGRAM_CLIENT_ID!,
      secret = process.env.TELEGRAM_CLIENT_SECRET!;
    const result = await fetch("https://oauth.telegram.org/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${appUrl()}/api/auth/telegram/callback`,
        client_id: clientId,
        code_verifier: challenge.verifier,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!result.ok) throw new Error("Token exchange failed");
    const tokens = await result.json();
    const payload = await verifyTelegramToken(tokens.id_token, clientId);
    const text = (v: unknown) =>
      typeof v === "string" ? v.slice(0, 200) : null;
    const data = {
      firstName: text(payload.given_name) ?? text(payload.name) ?? "Студент",
      lastName: text(payload.family_name),
      username: text(payload.preferred_username),
      photoUrl:
        typeof payload.picture === "string" &&
        payload.picture.startsWith("https://")
          ? payload.picture
          : null,
    };
    const user = await db.user.upsert({
      where: { telegramId: String(payload.id) },
      create: {
        telegramId: String(payload.id),
        ...data,
        settings: { create: {} },
      },
      update: data,
    });
    await createSession(user.id);
    return NextResponse.redirect(new URL("/", appUrl()));
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth", appUrl()));
  }
}
