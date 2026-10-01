import { db } from "./db";
import {
  mastery,
  practiceGpa,
  streak,
  eligible,
  publicIdentity,
  RULES,
  type Evidence,
} from "./learning";
export async function getProgress(userId: string) {
  const [subjects, reads, items] = await Promise.all([
    db.subject.findMany({
      orderBy: { order: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { topics: { orderBy: { order: "asc" } } },
        },
      },
    }),
    db.topicProgress.findMany({ where: { userId } }),
    db.practiceItem.findMany({
      where: {
        session: {
          userId,
          OR: [{ mode: { not: "exam" } }, { finishedAt: { not: null } }],
        },
        completedAt: { not: null },
      },
      include: { question: { select: { topicId: true, difficulty: true } } },
      orderBy: { completedAt: "desc" },
    }),
  ]);
  const evidence: Evidence[] = items.map((i) => ({
    questionId: i.questionId,
    topicId: i.question.topicId,
    difficulty: i.question.difficulty,
    attempts: i.attempts,
    hintLevel: i.hintLevel,
    correct: i.correct,
    completedAt: i.completedAt!,
    xp: i.xp,
  }));
  const topics = subjects.flatMap((s) =>
    s.modules.flatMap((m) =>
      m.topics.map((t) => {
        const results = evidence.filter((e) => e.topicId === t.id),
          read = reads.find((r) => r.topicId === t.id);
        const latestByQuestion = new Map<string, Evidence>();
        for (const result of [...results].reverse())
          latestByQuestion.set(result.questionId, result);
        const latestResults = [...latestByQuestion.values()];
        return {
          ...t,
          subjectId: s.id,
          subjectTitle: s.title,
          color: s.color,
          mastery: mastery(results),
          difficultyPerformance: Object.fromEntries(
            ["EASY", "MEDIUM", "HARD", "CHALLENGE"].map((level) => {
              const atLevel = latestResults.filter(
                (result) => result.difficulty === level,
              );
              return [
                level,
                {
                  correct: atLevel.filter((result) => result.correct).length,
                  total: atLevel.length,
                },
              ];
            }),
          ) as Record<string, { correct: number; total: number }>,
          assessed: results.length > 0,
          started: !!read || !!results.length,
          readAt: read?.readAt ?? null,
          lastPractice: results[0]?.completedAt ?? null,
          practiced:
            new Set(
              results
                .filter((e) => e.correct && e.xp > 0)
                .map((e) => e.questionId),
            ).size >= RULES.practicedQuestions,
          mistakes: results
            .slice(0, 5)
            .filter((e) => !e.correct || e.attempts > 1).length,
        };
      }),
    ),
  );
  const assessed = topics.filter((t) => t.assessed),
    overall = assessed.length
      ? Math.round(
          assessed.reduce((sum, t) => sum + t.mastery, 0) / assessed.length,
        )
      : null;
  const solved = new Set(
    evidence.filter((e) => e.correct).map((e) => e.questionId),
  ).size;
  return {
    subjects,
    topics,
    evidence,
    overall,
    gpa: overall === null ? null : practiceGpa(overall),
    assessedCount: assessed.length,
    xp: evidence.reduce((sum, e) => sum + e.xp, 0),
    solved,
    streak: streak(evidence, reads),
    weak: assessed
      .filter((t) => t.mastery < RULES.weakThreshold && t.mistakes > 0)
      .sort((a, b) => a.mastery - b.mastery || b.mistakes - a.mistakes),
    completed: topics.filter((t) => t.readAt).length,
  };
}
export async function getLeaderboard(period: string) {
  const now = new Date(),
    start =
      period === "week"
        ? new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate() - ((now.getUTCDay() + 6) % 7),
            ),
          )
        : period === "month"
          ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
          : new Date(0);
  const users = await db.user.findMany({
    where: { settings: { leaderboard: true } },
    include: {
      settings: true,
      sessions: {
        where: {
          OR: [{ mode: { not: "exam" } }, { finishedAt: { not: null } }],
        },
        include: {
          items: {
            where: { completedAt: { gte: start } },
            include: {
              question: { select: { topicId: true, difficulty: true } },
            },
          },
        },
      },
    },
  });
  return users
    .flatMap((u) => {
      const identity = publicIdentity(u);
      if (!identity) return [];
      const evidence: Evidence[] = u.sessions.flatMap((s) =>
        s.items.map((i) => ({
          ...i,
          topicId: i.question.topicId,
          difficulty: i.question.difficulty,
          completedAt: i.completedAt!,
        })),
      );
      if (!eligible(evidence)) return [];
      const topicIds = [...new Set(evidence.map((e) => e.topicId))];
      const overall =
        topicIds.reduce(
          (s, id) => s + mastery(evidence.filter((e) => e.topicId === id)),
          0,
        ) / topicIds.length;
      return [
        {
          ...identity,
          mastery: Math.round(overall),
          gpa: practiceGpa(overall),
          xp: evidence.reduce((s, e) => s + e.xp, 0),
        },
      ];
    })
    .sort(
      (a, b) =>
        b.mastery - a.mastery || b.xp - a.xp || a.id.localeCompare(b.id),
    );
}
