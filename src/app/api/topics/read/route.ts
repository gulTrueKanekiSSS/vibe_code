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
    const { topicId } = z
      .object({ topicId: z.string().max(100) })
      .parse(await request.json());
    await db.topicProgress.upsert({
      where: { userId_topicId: { userId: user.id, topicId } },
      create: { userId: user.id, topicId, readAt: new Date() },
      update: {},
    });
    await db.topicProgress.updateMany({
      where: { userId: user.id, topicId, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить тему." },
      { status: 400 },
    );
  }
}
