import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, sameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Недопустимый запрос." },
      { status: 403 },
    );
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  try {
    const data = z
      .object({
        showUsername: z.boolean(),
        showPhoto: z.boolean(),
        leaderboard: z.boolean(),
      })
      .parse(await request.json());
    await db.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить настройки." },
      { status: 400 },
    );
  }
}
