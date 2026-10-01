import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hash, sameOrigin, appUrl } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Недопустимый запрос" }, { status: 403 });
  const jar = await cookies();
  const token = jar.get("study_session")?.value;
  if (token)
    await db.authSession.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete("study_session");
  return NextResponse.redirect(new URL("/login", appUrl()), 303);
}
