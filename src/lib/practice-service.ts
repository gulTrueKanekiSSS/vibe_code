import { Prisma } from "@prisma/client";
import { db } from "./db";
import {
  checkAnswer,
  score,
  dayKey,
  dailySelection,
  RULES,
  type Difficulty,
} from "./learning";
import { getProgress } from "./progress";
import { automaticTopicIds } from "./curriculum";
import patterns from "../../content/practice-patterns.json";
export class PracticeError extends Error {}
export type CustomPracticeOptions = {
  topicIds: string[];
  difficulties: Difficulty[];
  count: number;
  questionTypes?: string[];
  patternIds?: string[];
  hintsAllowed?: boolean;
  feedbackMode?: "immediate" | "end";
};
export type StoredPracticeConfig = {
  subjectId?: string;
  topicIds: string[];
  difficulties: Difficulty[];
  questionTypes: string[];
  patternIds?: string[];
  count: number;
  hintsAllowed: boolean;
  feedbackMode: "immediate" | "end";
  overallBefore: number | null;
};
export function readPracticeConfig(
  value: unknown,
): StoredPracticeConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (
    !Array.isArray(source.topicIds) ||
    !Array.isArray(source.difficulties) ||
    !Array.isArray(source.questionTypes) ||
    typeof source.count !== "number"
  )
    return null;
  return {
    subjectId:
      typeof source.subjectId === "string" ? source.subjectId : undefined,
    topicIds: source.topicIds.filter(
      (id): id is string => typeof id === "string",
    ),
    difficulties: source.difficulties.filter((level): level is Difficulty =>
      ["EASY", "MEDIUM", "HARD", "CHALLENGE"].includes(level),
    ),
    questionTypes: source.questionTypes.filter(
      (type): type is string => typeof type === "string",
    ),
    patternIds: Array.isArray(source.patternIds)
      ? source.patternIds.filter((id): id is string => typeof id === "string")
      : [],
    count: source.count,
    hintsAllowed: source.hintsAllowed !== false,
    feedbackMode: source.feedbackMode === "end" ? "end" : "immediate",
    overallBefore:
      typeof source.overallBefore === "number" ? source.overallBefore : null,
  };
}
export function customSelection<
  T extends {
    id: string;
    topicId: string;
    difficulty: string;
    type: string;
    tags?: string[];
    selectionPriority?: number;
  },
>(questions: T[], options: CustomPracticeOptions): T[] {
  const allowedTopics = new Set(options.topicIds);
  const allowedDifficulties = new Set(options.difficulties);
  const allowedTypes = new Set(options.questionTypes ?? []);
  const groups = new Map<string, Map<string, T[]>>();
  for (const question of questions) {
    if (allowedTopics.size && !allowedTopics.has(question.topicId)) continue;
    if (!allowedDifficulties.has(question.difficulty as Difficulty)) continue;
    if (allowedTypes.size && !allowedTypes.has(question.type)) continue;
    if (
      options.patternIds?.length &&
      !options.patternIds.some((id) => question.tags?.includes(id))
    )
      continue;
    const byTopic = groups.get(question.difficulty) ?? new Map<string, T[]>();
    const group = byTopic.get(question.topicId) ?? [];
    group.push(question);
    byTopic.set(question.topicId, group);
    groups.set(question.difficulty, byTopic);
  }
  const selected: T[] = [];
  while (
    selected.length < options.count &&
    [...groups.values()].some((topics) =>
      [...topics.values()].some((g) => g.length),
    )
  ) {
    const priority = Math.min(
      ...[...groups.values()].flatMap((byTopic) =>
        [...byTopic.values()]
          .filter((group) => group.length)
          .map((group) => group[0].selectionPriority ?? 0),
      ),
    );
    for (const level of options.difficulties) {
      const byTopic = groups.get(level);
      if (!byTopic) continue;
      for (const [topicId, group] of byTopic) {
        if (!group.length || (group[0].selectionPriority ?? 0) !== priority)
          continue;
        const next = group.shift();
        if (next) {
          selected.push(next);
          byTopic.delete(topicId);
          byTopic.set(topicId, group);
          break;
        }
      }
      if (selected.length >= options.count) break;
    }
  }
  return selected;
}
export function mixedExamSelection<T extends { id: string; topicId: string }>(
  questions: T[],
  topics: { id: string; subjectId: string }[],
) {
  const groups = new Map<string, T[]>();
  for (const q of questions) {
    const key = topics.find((t) => t.id === q.topicId)?.subjectId ?? "";
    const group = groups.get(key) ?? [];
    group.push(q);
    groups.set(key, group);
  }
  const selected: T[] = [];
  while (
    selected.length < RULES.examCount &&
    [...groups.values()].some((g) => g.length)
  )
    for (const group of groups.values()) {
      const next = group.shift();
      if (next) selected.push(next);
      if (selected.length >= RULES.examCount) break;
    }
  return selected;
}
export async function serial<T>(
  userId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db.$transaction(async (tx) => {
    // Lock the learner for all mutations, so two sessions cannot award the same question twice.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    return work(tx);
  });
}
export async function startPractice(
  userId: string,
  mode: string,
  topicId?: string,
  subjectId?: string,
  requestKey?: string,
  custom?: CustomPracticeOptions,
) {
  if ((mode === "topic" && !topicId) || (mode === "subject" && !subjectId))
    throw new PracticeError("Выбери тему или предмет.");
  if (
    custom?.patternIds?.some(
      (id) => !patterns.some((pattern) => pattern.id === id),
    )
  )
    throw new PracticeError("Неизвестная категория заданий.");
  if (
    mode === "custom" &&
    (!custom ||
      !custom.difficulties.length ||
      (custom.questionTypes !== undefined && !custom.questionTypes.length) ||
      custom.count < 1 ||
      custom.count > 20)
  )
    throw new PracticeError("Выбери сложность и количество заданий.");
  return serial(userId, async (tx) => {
    const startKey = requestKey
      ? JSON.stringify([
          userId,
          mode,
          topicId ?? null,
          subjectId ?? null,
          custom ? [...custom.topicIds].sort() : null,
          custom ? [...custom.difficulties].sort() : null,
          custom?.questionTypes ? [...custom.questionTypes].sort() : null,
          custom?.count ?? null,
          custom?.hintsAllowed ?? null,
          custom?.feedbackMode ?? null,
          requestKey,
          ...(custom?.patternIds?.length
            ? [[...custom.patternIds].sort()]
            : []),
        ])
      : null;
    if (startKey) {
      const existing = await tx.practiceSession.findUnique({
        where: { startKey },
      });
      if (existing) return existing.id;
    }
    const dailyKey = mode === "daily" ? `${userId}:${dayKey()}` : null;
    if (dailyKey) {
      const existing = await tx.practiceSession.findUnique({
        where: { dailyKey },
      });
      if (existing) return existing.id;
    }
    const p = await getProgress(userId);
    let questions = await tx.question.findMany({
      where: {
        ...(mode !== "custom" && !topicId
          ? { topicId: { in: automaticTopicIds } }
          : {}),
        ...(topicId ? { topicId } : {}),
        ...(subjectId ? { topic: { module: { subjectId } } } : {}),
      },
      select: {
        id: true,
        topicId: true,
        difficulty: true,
        type: true,
        tags: true,
      },
      orderBy: { id: "asc" },
    });
    const seen = await tx.practiceItem.findMany({
      where: {
        session: { userId },
        completedAt: { not: null },
        questionId: { in: questions.map((q) => q.id) },
      },
      select: { questionId: true, correct: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    });
    const latest = new Map<string, (typeof seen)[number]>();
    for (const item of seen)
      if (!latest.has(item.questionId)) latest.set(item.questionId, item);
    const rank = (id: string) => {
      const item = latest.get(id);
      if (!item) return 0;
      if (!item.correct) return 1;
      return item.completedAt!.getTime() < Date.now() - 14 * 86400000 ? 2 : 3;
    };
    questions.sort(
      (a, b) =>
        rank(a.id) - rank(b.id) ||
        (latest.get(a.id)?.completedAt?.getTime() ?? 0) -
          (latest.get(b.id)?.completedAt?.getTime() ?? 0) ||
        a.id.localeCompare(b.id),
    );
    const rankedQuestions = questions.map((question) => ({
      ...question,
      selectionPriority: rank(question.id),
    }));
    if (mode === "weak") {
      if (!p.weak.length)
        throw new PracticeError(
          "Пока нет слабых тем для повторения. Начни с быстрой практики.",
        );
      questions = questions.filter((q) =>
        p.weak.some((t) => t.id === q.topicId),
      );
    }
    if (mode === "custom") {
      if (custom!.topicIds.length && subjectId) {
        const requested = new Set(custom!.topicIds);
        const validTopics = await tx.topic.findMany({
          where: { id: { in: [...requested] }, module: { subjectId } },
          select: { id: true },
        });
        const valid = new Set(validTopics.map((topic) => topic.id));
        if (valid.size !== requested.size)
          throw new PracticeError("Выбранные темы не относятся к предмету.");
      }
      questions = customSelection(rankedQuestions, custom!);
    } else if (mode === "exam")
      questions = mixedExamSelection(questions, p.topics);
    else if (mode === "daily" || mode === "quick" || mode === "weak")
      questions = dailySelection(
        questions.map((question) => ({
          ...question,
          selectionPriority: rank(question.id),
        })),
        p.topics,
        dayKey(),
      );
    else questions = questions.slice(0, 10);
    if (!questions.length)
      throw new PracticeError("Для выбранных тем пока нет заданий.");
    if (mode === "custom" && questions.length < custom!.count)
      throw new PracticeError(
        `Доступно только ${questions.length} заданий. Уменьши количество или расширь фильтры.`,
      );
    const active = await tx.practiceSession.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 3600000) } },
    });
    if (active >= 30)
      throw new PracticeError(
        "Слишком много сессий. Продолжи существующую или вернись через час.",
      );
    const session = await tx.practiceSession.create({
      data: {
        userId,
        mode,
        config: {
          ...(subjectId ? { subjectId } : {}),
          topicIds: custom
            ? custom.topicIds
            : [...new Set(questions.map((q) => q.topicId))],
          difficulties: custom?.difficulties ?? [
            ...new Set(questions.map((q) => q.difficulty)),
          ],
          questionTypes: custom?.questionTypes ?? [
            ...new Set(questions.map((q) => q.type)),
          ],
          patternIds: custom?.patternIds ?? [],
          count: custom?.count ?? questions.length,
          hintsAllowed: custom?.hintsAllowed ?? mode !== "exam",
          feedbackMode:
            custom?.feedbackMode ?? (mode === "exam" ? "end" : "immediate"),
          overallBefore: p.overall,
        },
        dailyKey,
        startKey,
        items: {
          create: questions.map((q, position) => ({
            questionId: q.id,
            position,
          })),
        },
      },
    });
    return session.id;
  });
}
export async function repeatPractice(
  userId: string,
  sessionId: string,
  requestKey: string,
) {
  const session = await db.practiceSession.findFirst({
    where: { id: sessionId, userId, finishedAt: { not: null } },
    select: { config: true },
  });
  if (!session) throw new PracticeError("Завершённая сессия не найдена.");
  const config = readPracticeConfig(session.config);
  if (!config)
    throw new PracticeError(
      "Для этой старой сессии настройки не сохранены. Собери новую практику.",
    );
  return startPractice(
    userId,
    "custom",
    undefined,
    config.subjectId,
    requestKey,
    {
      topicIds: config.topicIds,
      difficulties: config.difficulties,
      questionTypes: config.questionTypes,
      patternIds: config.patternIds,
      count: config.count,
      hintsAllowed: config.hintsAllowed,
      feedbackMode: config.feedbackMode,
    },
  );
}
export async function submitPractice(
  userId: string,
  itemId: string,
  submissionKey: string,
  answer: Prisma.InputJsonValue,
) {
  return serial(userId, async (tx) => {
    const item = await tx.practiceItem.findFirst({
      where: { id: itemId, session: { userId } },
      include: { question: true, session: true },
    });
    if (!item) throw new PracticeError("Задание не найдено.");
    const prior = await tx.practiceAttempt.findUnique({
      where: { submissionKey },
    });
    if (prior && prior.itemId !== item.id)
      throw new PracticeError("Некорректный идентификатор ответа.");
    const exam = item.session.mode === "exam";
    const delayed =
      exam || readPracticeConfig(item.session.config)?.feedbackMode === "end";
    if (prior || item.completedAt)
      return {
        correct: delayed ? null : item.correct,
        finished: !!item.completedAt,
        xp: delayed ? null : item.xp,
        attempts: item.attempts,
        solution: delayed
          ? null
          : item.completedAt
            ? item.question.solution
            : null,
        feedback:
          delayed || prior?.correct
            ? null
            : prior
              ? feedbackFor(
                  item.question.feedback,
                  prior.answer,
                  item.question.hints[0],
                )
              : null,
      };
    if (item.attempts >= RULES.maxAttempts)
      throw new PracticeError("Лимит попыток исчерпан.");
    const correct = checkAnswer(
        item.question.type,
        item.question.answer,
        answer,
      ),
      attempts = item.attempts + 1,
      finished = delayed || correct || attempts >= RULES.maxAttempts;
    const previousReward = correct
      ? await tx.practiceItem.findFirst({
          where: {
            questionId: item.questionId,
            correct: true,
            session: { userId },
          },
        })
      : null;
    const xp =
      correct && !previousReward
        ? score(
            item.question.difficulty as Difficulty,
            attempts,
            item.hintLevel,
          )
        : 0;
    await tx.practiceAttempt.create({
      data: { itemId, submissionKey, answer, correct },
    });
    await tx.practiceItem.update({
      where: { id: itemId },
      data: {
        attempts,
        correct,
        xp,
        completedAt: finished ? new Date() : null,
      },
    });
    await tx.topicProgress.upsert({
      where: { userId_topicId: { userId, topicId: item.question.topicId } },
      create: { userId, topicId: item.question.topicId },
      update: {},
    });
    if (
      finished &&
      (await tx.practiceItem.count({
        where: { sessionId: item.sessionId, completedAt: null },
      })) === 0
    )
      await tx.practiceSession.update({
        where: { id: item.sessionId },
        data: { finishedAt: new Date() },
      });
    return {
      correct: delayed ? null : correct,
      finished,
      xp: delayed ? null : xp,
      attempts,
      solution: delayed ? null : finished ? item.question.solution : null,
      feedback:
        delayed || correct
          ? null
          : feedbackFor(item.question.feedback, answer, item.question.hints[0]),
    };
  });
}
function feedbackFor(source: unknown, answer: unknown, fallback: string) {
  const map =
    source && typeof source === "object" && !Array.isArray(source)
      ? (source as Record<string, unknown>)
      : {};
  const key = typeof answer === "string" ? answer.trim() : "";
  return typeof map[key] === "string" ? (map[key] as string) : fallback;
}
export async function revealHint(userId: string, itemId: string) {
  return serial(userId, async (tx) => {
    const item = await tx.practiceItem.findFirst({
      where: { id: itemId, session: { userId } },
      include: { question: true, session: true },
    });
    if (!item || item.completedAt)
      throw new PracticeError("Подсказка недоступна.");
    if (
      item.session.mode === "exam" ||
      readPracticeConfig(item.session.config)?.hintsAllowed === false
    )
      throw new PracticeError(
        item.session.mode === "exam"
          ? "В режиме экзамена подсказки отключены."
          : "Подсказки отключены в настройках сессии.",
      );
    const level = Math.min(4, item.hintLevel + 1);
    await tx.practiceItem.update({
      where: { id: item.id },
      data: { hintLevel: level },
    });
    return {
      level,
      text:
        level === 4 ? item.question.solution : item.question.hints[level - 1],
    };
  });
}
