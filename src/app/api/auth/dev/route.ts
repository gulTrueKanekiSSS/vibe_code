import { NextResponse } from "next/server";
import { createSession, devAuthEnabled, sameOrigin, appUrl } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  if (!devAuthEnabled() || !sameOrigin(request))
    return NextResponse.json({ error: "Недоступно" }, { status: 403 });
  const user = await db.user.upsert({
    where: { telegramId: "dev-local" },
    create: {
      telegramId: "dev-local",
      firstName: "Дмитрий",
      username: "local_student",
      settings: { create: {} },
    },
    update: {},
  });
  await createSession(user.id);
  return NextResponse.redirect(new URL("/", appUrl()), 303);
}
