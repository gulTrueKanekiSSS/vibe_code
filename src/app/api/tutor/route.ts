import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, sameOrigin } from "@/lib/auth";
import { tutorContextSchema, TutorError } from "@/lib/tutor-context";
import { TUTOR_LIMITS } from "@/lib/tutor/policy";
import {
  getTutorSnapshot,
  sendTutorMessage,
  resetTutorConversation,
} from "@/lib/tutor-service";

export const runtime = "nodejs";
const schema = z.union([
  z
    .object({
      context: tutorContextSchema,
      message: z.string().trim().min(1).max(TUTOR_LIMITS.messageCharacters),
      requestKey: z.uuid(),
    })
    .strict(),
  z
    .object({ action: z.literal("reset"), context: tutorContextSchema })
    .strict(),
]);
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof TutorError
          ? error.message
          : error instanceof z.ZodError || error instanceof SyntaxError
            ? "Проверь формат сообщения."
            : "Tutor временно недоступен. Попробуй позже.",
    },
    {
      status:
        error instanceof TutorError
          ? error.status
          : error instanceof z.ZodError || error instanceof SyntaxError
            ? 400
            : 503,
      headers,
    },
  );
}
// Limit bytes while reading, not after request.json() has allocated the body.
async function boundedJSON(request: Request) {
  const maxBytes = TUTOR_LIMITS.requestBytes;
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes)
    throw new TutorError("Сообщение слишком большое.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new TutorError("Нет сообщения.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new TutorError("Сообщение слишком большое.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
export async function GET(request: Request) {
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (request.headers.has("origin") && !sameOrigin(request))
  )
    return failure(new TutorError("Недопустимый источник запроса.", 403));
  try {
    const user = await currentUser();
    if (!user) return failure(new TutorError("Войди в аккаунт.", 401));
    const params = new URL(request.url).searchParams;
    if (
      [...params.keys()].some(
        (key) => !["topicId", "sectionIndex", "practiceItemId"].includes(key),
      ) ||
      [...params.keys()].some((key) => params.getAll(key).length > 1)
    )
      throw new TutorError("Некорректный контекст.");
    const context = tutorContextSchema.parse({
      ...(params.has("topicId") ? { topicId: params.get("topicId") } : {}),
      ...(params.has("practiceItemId")
        ? { practiceItemId: params.get("practiceItemId") }
        : {}),
      ...(params.has("sectionIndex")
        ? {
            sectionIndex: /^\d+$/.test(params.get("sectionIndex")!)
              ? Number(params.get("sectionIndex"))
              : NaN,
          }
        : {}),
    });
    return NextResponse.json(await getTutorSnapshot(user.id, context), {
      headers,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return failure(new TutorError("Недопустимый источник запроса.", 403));
  try {
    const user = await currentUser();
    if (!user) return failure(new TutorError("Войди в аккаунт.", 401));
    const body = schema.parse(await boundedJSON(request));
    const snapshot =
      "action" in body
        ? await resetTutorConversation(user.id, body.context)
        : await sendTutorMessage(user.id, body);
    return NextResponse.json(snapshot, { headers });
  } catch (error) {
    return failure(error);
  }
}
