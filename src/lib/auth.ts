import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "./db";
import { isAllowedRequestOrigin } from "./request-origin";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const devAuthEnabled = () =>
  process.env.NODE_ENV === "development" && process.env.DEV_AUTH === "true";
export async function currentUser() {
  const token = (await cookies()).get("study_session")?.value;
  if (!token) return null;
  const session = await db.authSession.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: { include: { settings: true } } },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  await db.authSession.create({
    data: { tokenHash: hash(token), userId, expiresAt },
  });
  (await cookies()).set("study_session", token, {
    ...cookieOptions,
    expires: expiresAt,
  });
}
export function sameOrigin(request: Request) {
  return isAllowedRequestOrigin(
    request.headers.get("origin"),
    request.url,
    appUrl(),
    process.env.NODE_ENV === "development",
  );
}
