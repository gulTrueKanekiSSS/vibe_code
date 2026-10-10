import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import {
  resolveTutorContext,
  protectedTutorReason,
  TutorError,
  tutorContextSchema,
  type TutorContextInput,
  type ResolvedTutorContext,
} from "./tutor-context";
import { getTutorProvider } from "./tutor/provider";
import { retrieveCourseContext } from "./tutor/retrieval";
import {
  boundedHistory,
  buildTutorReply,
  INSUFFICIENT_MATERIAL,
  TUTOR_LIMITS,
} from "./tutor/policy";
import type {
  TutorProvider,
  TutorSnapshot,
  TutorGenerationInput,
  TutorSource,
} from "./tutor/types";

export type TutorDependencies = {
  provider?: TutorProvider | null;
  retrieve?: typeof retrieveCourseContext;
};
const MAX_MESSAGES = 120;
const LEASE_MS = 120_000;
const FAILURE =
  "Не удалось получить ответ Tutor. Отправь новое сообщение, чтобы попробовать ещё раз.";
const EXPIRED =
  "Ответ Tutor прерван. Отправь новое сообщение, чтобы продолжить.";
const configuredProvider = (deps: TutorDependencies) =>
  deps.provider === undefined ? getTutorProvider() : deps.provider;

function serial<T>(
  userId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db.$transaction(async (tx) => {
    const users = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    if (!users.length) throw new TutorError("Войди в аккаунт.", 401);
    return work(tx);
  });
}
async function snapshot(
  userId: string,
  context: ResolvedTutorContext,
  available: boolean,
  client: Prisma.TransactionClient = db,
): Promise<TutorSnapshot> {
  const reason =
    context.unavailableReason ?? (await protectedTutorReason(userId, client));
  if (reason)
    return {
      context: context.display,
      conversationId: null,
      messages: [],
      available: false,
      unavailableReason: reason,
    };
  const conversation = await client.tutorConversation.findUnique({
    where: { userId_contextKey: { userId, contextKey: context.key } },
    include: {
      messages: {
        orderBy: [{ createdAt: "asc" }, { role: "desc" }],
        take: MAX_MESSAGES,
      },
    },
  });
  return {
    context: context.display,
    conversationId: conversation?.id ?? null,
    messages: (conversation?.messages ?? []).map((message) => {
      const expired =
        message.status === "pending" &&
        (!conversation?.busyUntil || conversation.busyUntil <= new Date());
      return {
        id: message.id,
        role: message.role as "user" | "assistant",
        content: expired ? EXPIRED : message.content,
        status: expired
          ? "failed"
          : (message.status as "pending" | "complete" | "failed"),
        sources: message.sources as unknown as TutorSource[],
        requestKey: message.requestKey,
      };
    }),
    available,
    ...(!available
      ? {
          unavailableReason:
            "Tutor пока не настроен. Материалы урока и практика доступны.",
        }
      : {}),
  };
}
export async function getTutorSnapshot(
  userId: string,
  input: TutorContextInput,
  deps: TutorDependencies = {},
) {
  return serial(userId, async (tx) =>
    snapshot(
      userId,
      await resolveTutorContext(userId, input, tx),
      !!configuredProvider(deps),
      tx,
    ),
  );
}
export async function resetTutorConversation(
  userId: string,
  input: TutorContextInput,
  deps: TutorDependencies = {},
) {
  return serial(userId, async (tx) => {
    const context = await resolveTutorContext(userId, input, tx);
    if (context.unavailableReason) return snapshot(userId, context, false, tx);
    const conversation = await tx.tutorConversation.findUnique({
      where: { userId_contextKey: { userId, contextKey: context.key } },
    });
    if (conversation?.busyUntil && conversation.busyUntil > new Date())
      throw new TutorError("Дождись ответа Tutor.", 409);
    if (conversation)
      await tx.tutorConversation.delete({
        where: { id: conversation.id, userId },
      });
    return snapshot(userId, context, !!configuredProvider(deps), tx);
  });
}
const sendSchema = z
  .object({
    context: tutorContextSchema,
    message: z.string().trim().min(1).max(TUTOR_LIMITS.messageCharacters),
    requestKey: z.uuid(),
  })
  .strict();

function boundedStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  let bytes = 0;
  for (const entry of value.slice(0, 20)) {
    if (typeof entry !== "string") continue;
    const text = entry.slice(0, 1000);
    bytes += Buffer.byteLength(text, "utf8");
    if (bytes > 4000) break;
    result.push(text);
  }
  return result;
}

function generationInput(
  context: ResolvedTutorContext,
  message: string,
  history: TutorGenerationInput["history"],
): TutorGenerationInput {
  const exercise = context.safe.exercise;
  const answer = exercise?.submittedAnswer;
  return {
    context: context.display,
    message,
    history: boundedHistory(history),
    sources: [],
    ...(exercise
      ? {
          exercise: {
            prompt: exercise.prompt,
            type: exercise.type,
            options: boundedStrings(exercise.options),
            difficulty: exercise.difficulty,
            studentAnswer:
              typeof answer === "string"
                ? answer.slice(0, 4000)
                : Array.isArray(answer) &&
                    answer.every((a) => typeof a === "string")
                  ? boundedStrings(answer)
                  : null,
            attemptCount: exercise.attempts,
            hintsUsed: exercise.usedHints,
            ...(exercise.solution ? { solution: exercise.solution } : {}),
          },
        }
      : {}),
  };
}

export async function sendTutorMessage(
  userId: string,
  raw: z.input<typeof sendSchema>,
  deps: TutorDependencies = {},
): Promise<TutorSnapshot> {
  const body = sendSchema.parse(raw);
  const provider = configuredProvider(deps);
  const admission = await serial(userId, async (tx) => {
    const context = await resolveTutorContext(userId, body.context, tx);
    if (context.unavailableReason || !provider)
      return { result: await snapshot(userId, context, false, tx) };
    let conversation = await tx.tutorConversation.findUnique({
      where: { userId_contextKey: { userId, contextKey: context.key } },
    });
    if (!conversation) {
      if ((await tx.tutorConversation.count({ where: { userId } })) >= 200)
        throw new TutorError(
          "Достигнут лимит диалогов. Продолжи существующий диалог или очисти его.",
          429,
        );
      conversation = await tx.tutorConversation.create({
        data: {
          userId,
          topicId: context.topicId,
          itemId: context.itemId,
          contextKey: context.key,
        },
      });
    }
    const now = new Date();
    if (!conversation.busyUntil || conversation.busyUntil <= now) {
      await tx.tutorMessage.updateMany({
        where: {
          conversationId: conversation.id,
          status: "pending",
          role: "assistant",
        },
        data: { status: "failed", content: EXPIRED },
      });
    }
    const prior = await tx.tutorMessage.findUnique({
      where: {
        conversationId_requestKey_role: {
          conversationId: conversation.id,
          requestKey: body.requestKey,
          role: "user",
        },
      },
    });
    if (prior) {
      if (prior.content !== body.message)
        throw new TutorError(
          "Идентификатор уже использован для другого сообщения.",
          409,
        );
      return { result: await snapshot(userId, context, true, tx) };
    }
    if (conversation.busyUntil && conversation.busyUntil > now)
      throw new TutorError("Дождись предыдущего ответа Tutor.", 409);
    if (
      (await tx.tutorMessage.count({
        where: { conversationId: conversation.id },
      })) >= MAX_MESSAGES
    )
      throw new TutorError("Диалог достиг лимита. Начни новый диалог.", 409);
    const usage = await tx.tutorUsage.findUnique({ where: { userId } });
    const windowStart =
      usage && now.getTime() - usage.windowStart.getTime() < 3_600_000
        ? usage.windowStart
        : now;
    const dayStart =
      usage && now.getTime() - usage.dayStart.getTime() < 86_400_000
        ? usage.dayStart
        : now;
    const count = usage && windowStart === usage.windowStart ? usage.count : 0;
    const dayCount = usage && dayStart === usage.dayStart ? usage.dayCount : 0;
    if (count >= 30 || dayCount >= 150)
      throw new TutorError("Лимит Tutor исчерпан. Попробуй позже.", 429);
    await tx.tutorUsage.upsert({
      where: { userId },
      create: {
        userId,
        windowStart,
        dayStart,
        count: count + 1,
        dayCount: dayCount + 1,
      },
      update: {
        windowStart,
        dayStart,
        count: count + 1,
        dayCount: dayCount + 1,
      },
    });
    const history = await tx.tutorMessage.findMany({
      where: { conversationId: conversation.id, status: "complete" },
      orderBy: [{ createdAt: "desc" }, { role: "asc" }],
      take: 12,
      select: { role: true, content: true },
    });
    const token = randomUUID();
    await tx.tutorConversation.update({
      where: { id: conversation.id, userId },
      data: { busyToken: token, busyUntil: new Date(now.getTime() + LEASE_MS) },
    });
    await tx.tutorMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          requestKey: body.requestKey,
          role: "user",
          content: body.message,
          status: "complete",
          createdAt: now,
        },
        {
          conversationId: conversation.id,
          requestKey: body.requestKey,
          role: "assistant",
          content: "",
          status: "pending",
          createdAt: new Date(now.getTime() + 1),
        },
      ],
    });
    return {
      conversationId: conversation.id,
      token,
      context,
      input: generationInput(
        context,
        body.message,
        history.reverse().map((entry) => ({
          role: entry.role as "user" | "assistant",
          content: entry.content,
        })),
      ),
    };
  });
  if ("result" in admission) return admission.result!;

  // External calls happen outside the admission transaction; the lease bounds concurrency.
  let reply: { content: string; sources: TutorSource[] } = {
    content: FAILURE,
    sources: [],
  };
  let failed = false;
  try {
    if (!admission.context.display.restricted)
      admission.input.sources = await (deps.retrieve ?? retrieveCourseContext)(
        {
          topicId: admission.context.topicId,
          sectionIndex: admission.context.sectionIndex,
          query: body.message,
        },
        provider!,
      );
    reply =
      !admission.context.display.restricted && !admission.input.sources.length
        ? { content: INSUFFICIENT_MATERIAL, sources: [] }
        : buildTutorReply(
            await provider!.generateTutorResponse(admission.input),
            admission.input,
          );
  } catch {
    failed = true;
  }

  return serial(userId, async (tx) => {
    const context = await resolveTutorContext(userId, body.context, tx);
    const conversation = await tx.tutorConversation.findFirst({
      where: {
        id: admission.conversationId,
        userId,
        busyToken: admission.token,
      },
    });
    if (!conversation) return snapshot(userId, context, true, tx);
    // Recheck after provider work: an exam may have started during the request.
    const suppressed =
      !!context.unavailableReason ||
      (!!conversation.busyUntil && conversation.busyUntil <= new Date());
    await tx.tutorMessage.updateMany({
      where: {
        conversationId: conversation.id,
        requestKey: body.requestKey,
        role: "assistant",
        status: "pending",
      },
      data: {
        content: suppressed ? EXPIRED : reply.content,
        status: suppressed || failed ? "failed" : "complete",
        sources:
          suppressed || failed
            ? []
            : (reply.sources as unknown as Prisma.InputJsonValue),
      },
    });
    await tx.tutorConversation.update({
      where: { id: conversation.id, userId, busyToken: admission.token },
      data: { busyUntil: null, busyToken: null },
    });
    return snapshot(userId, context, true, tx);
  });
}
