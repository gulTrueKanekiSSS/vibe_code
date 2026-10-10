import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";

const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const tutorContextSchema = z
  .object({
    topicId: id.optional(),
    sectionIndex: z.number().int().min(0).max(200).optional(),
    practiceItemId: id.optional(),
  })
  .strict()
  .refine((value) => !!value.topicId || !!value.practiceItemId)
  .refine((value) => !value.practiceItemId || value.sectionIndex === undefined);
export type TutorContextInput = z.infer<typeof tutorContextSchema>;
export class TutorError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Client = Prisma.TransactionClient;
export type ResolvedTutorContext = {
  key: string;
  subjectId: string;
  topicId: string;
  sectionIndex?: number;
  itemId?: string;
  display: {
    subjectTitle: string;
    moduleTitle: string;
    topicTitle: string;
    topicId: string;
    sectionTitle?: string;
    practiceItemId?: string;
    restricted: boolean;
  };
  safe: {
    subjectTitle: string;
    moduleTitle: string;
    topicTitle: string;
    sectionTitle?: string;
    exercise?: {
      prompt: string;
      type: string;
      difficulty: string;
      options: Prisma.JsonValue;
      submittedAnswer: Prisma.JsonValue | null;
      attempts: number;
      usedHints: string[];
      solution?: string;
    };
  };
  unavailableReason?: string;
};

// This is deliberately user-wide: opening another lesson must not bypass an exam.
export async function protectedTutorSession(
  userId: string,
  client: Client = db,
) {
  return client.practiceSession.findFirst({
    where: {
      userId,
      finishedAt: null,
      OR: [
        { mode: "exam" },
        { config: { path: ["feedbackMode"], equals: "end" } },
        { config: { path: ["hintsAllowed"], equals: false } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, mode: true, createdAt: true },
  });
}
export async function protectedTutorReason(
  userId: string,
  client: Client = db,
) {
  const protectedSession = await protectedTutorSession(userId, client);
  return protectedSession
    ? "Tutor недоступен, пока не завершена сессия экзамена, с отложенной проверкой или без подсказок."
    : undefined;
}

export async function resolveTutorContext(
  userId: string,
  input: TutorContextInput,
  client: Client = db,
): Promise<ResolvedTutorContext> {
  input = tutorContextSchema.parse(input);
  const unavailableReason = await protectedTutorReason(userId, client);
  const item = input.practiceItemId
    ? await client.practiceItem.findFirst({
        where: { id: input.practiceItemId, session: { userId } },
        select: {
          id: true,
          hintLevel: true,
          attempts: true,
          completedAt: true,
          session: { select: { finishedAt: true, mode: true, config: true } },
          question: {
            select: {
              id: true,
              topicId: true,
              prompt: true,
              type: true,
              difficulty: true,
              options: true,
              hints: true,
            },
          },
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { answer: true },
          },
        },
      })
    : null;
  if (input.practiceItemId && !item)
    throw new TutorError("Задание не найдено.", 404);
  if (item && input.topicId && input.topicId !== item.question.topicId)
    throw new TutorError("Тема не соответствует заданию.");
  const topicId = item?.question.topicId ?? input.topicId!;
  const topic = await client.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      title: true,
      content: true,
      module: {
        select: {
          title: true,
          subjectId: true,
          subject: { select: { title: true } },
        },
      },
    },
  });
  if (!topic) throw new TutorError("Тема не найдена.", 404);
  const content = topic.content as { sections?: { title?: string }[] } | null;
  const section =
    input.sectionIndex === undefined
      ? undefined
      : content?.sections?.[input.sectionIndex];
  if (input.sectionIndex !== undefined && !section?.title)
    throw new TutorError("Раздел не найден.", 404);
  const config = item?.session.config as { feedbackMode?: string } | undefined;
  const solutionVisible =
    !!item &&
    (!!item.session.finishedAt ||
      (item.session.mode !== "exam" &&
        config?.feedbackMode !== "end" &&
        (!!item.completedAt || item.hintLevel >= 4)));
  const display = {
    subjectTitle: topic.module.subject.title,
    moduleTitle: topic.module.title,
    topicTitle: topic.title,
    topicId,
    ...(section?.title ? { sectionTitle: section.title } : {}),
    ...(item ? { practiceItemId: item.id } : {}),
    restricted: !!item && !solutionVisible,
  };
  // Do not select expectedAnswer, correctness, feedback maps or hidden solutions.
  // The solution is read separately only after the existing visibility rules allow it.
  const solution =
    item && solutionVisible && !unavailableReason
      ? (
          await client.question.findUnique({
            where: { id: item.question.id },
            select: { solution: true },
          })
        )?.solution
      : undefined;
  return {
    key: item
      ? `practice:${item.id}`
      : `topic:${topicId}:section:${input.sectionIndex ?? "all"}`,
    subjectId: topic.module.subjectId,
    topicId,
    sectionIndex: input.sectionIndex,
    itemId: item?.id,
    display,
    unavailableReason,
    safe: {
      subjectTitle: display.subjectTitle,
      moduleTitle: display.moduleTitle,
      topicTitle: display.topicTitle,
      sectionTitle: display.sectionTitle,
      ...(item && !unavailableReason
        ? {
            exercise: {
              prompt: item.question.prompt.slice(0, 8000),
              type: item.question.type,
              difficulty: item.question.difficulty,
              options: item.question.options,
              submittedAnswer: item.submissions[0]?.answer ?? null,
              attempts: item.attempts,
              usedHints: item.question.hints.slice(
                0,
                Math.min(3, item.hintLevel),
              ),
              ...(solution ? { solution: solution.slice(0, 8000) } : {}),
            },
          }
        : {}),
    },
  };
}
