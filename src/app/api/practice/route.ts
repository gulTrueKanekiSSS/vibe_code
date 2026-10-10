import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, sameOrigin } from "@/lib/auth";
import {
  PracticeError,
  startPractice,
  submitPractice,
  revealHint,
  repeatPractice,
  finishPractice,
} from "@/lib/practice-service";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    mode: z.enum([
      "daily",
      "quick",
      "topic",
      "subject",
      "weak",
      "exam",
      "custom",
    ]),
    topicId: z.string().max(100).optional(),
    subjectId: z.string().max(100).optional(),
    topicIds: z.array(z.string().min(1).max(100)).max(100).optional(),
    difficulties: z
      .array(z.enum(["EASY", "MEDIUM", "HARD", "CHALLENGE"]))
      .min(1)
      .max(4)
      .optional(),
    questionTypes: z
      .array(
        z.enum([
          "NUMERIC",
          "SHORT_TEXT",
          "MULTIPLE_CHOICE",
          "MULTI_SELECT",
          "TRUE_FALSE",
          "STEPS",
          "OUTPUT",
          "FIX_CODE",
          "CONCEPTUAL",
        ]),
      )
      .min(1)
      .max(9)
      .optional(),
    hintsAllowed: z.boolean().optional(),
    patternIds: z.array(z.string().min(1).max(60)).max(30).optional(),
    feedbackMode: z.enum(["immediate", "end"]).optional(),
    count: z.number().int().min(1).max(20).optional(),
    requestKey: z.uuid(),
  }),
  z.object({
    action: z.literal("answer"),
    itemId: z.string().max(100),
    submissionKey: z.uuid(),
    answer: z.union([
      z.string().max(4000),
      z.array(z.string().max(1000)).max(20),
    ]),
  }),
  z.object({ action: z.literal("hint"), itemId: z.string().max(100) }),
  z.object({
    action: z.literal("repeat"),
    sessionId: z.string().max(100),
    requestKey: z.uuid(),
  }),
  z.strictObject({
    action: z.literal("finish"),
    sessionId: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z0-9_-]+$/),
  }),
]);
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Недопустимый источник запроса." },
      { status: 403 },
    );
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Войди в аккаунт." }, { status: 401 });
  try {
    const body = schema.parse(await request.json());
    if (body.action === "finish")
      return NextResponse.json(await finishPractice(user.id, body.sessionId));
    if (body.action === "start")
      return NextResponse.json({
        sessionId: await startPractice(
          user.id,
          body.mode,
          body.topicId,
          body.subjectId,
          body.requestKey,
          body.mode === "custom" && body.difficulties && body.count
            ? {
                topicIds: body.topicIds ?? [],
                difficulties: body.difficulties,
                count: body.count,
                questionTypes: body.questionTypes,
                patternIds: body.patternIds,
                hintsAllowed: body.hintsAllowed,
                feedbackMode: body.feedbackMode,
              }
            : undefined,
        ),
      });
    if (body.action === "hint")
      return NextResponse.json(await revealHint(user.id, body.itemId));
    if (body.action === "repeat")
      return NextResponse.json({
        sessionId: await repeatPractice(
          user.id,
          body.sessionId,
          body.requestKey,
        ),
      });
    return NextResponse.json(
      await submitPractice(
        user.id,
        body.itemId,
        body.submissionKey,
        body.answer,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof PracticeError
            ? error.message
            : error instanceof z.ZodError
              ? "Проверь формат ответа."
              : "Не удалось сохранить результат. Попробуй ещё раз.",
      },
      { status: 400 },
    );
  }
}
