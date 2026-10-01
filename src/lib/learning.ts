export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "CHALLENGE";
export const RULES = {
  xp: { EASY: 10, MEDIUM: 20, HARD: 30, CHALLENGE: 50 },
  difficulty: { EASY: 0.65, MEDIUM: 0.85, HARD: 1, CHALLENGE: 1 },
  hints: [1, 0.9, 0.8, 0.65, 0.4],
  dailyCount: 5,
  examCount: 15,
  maxAttempts: 3,
  practicedQuestions: 3,
  weakThreshold: 70,
  reviewAfterDays: 14,
  streakCount: 3,
  eligibleSolved: 30,
  eligibleTopics: 3,
};
export const clamp = (n: number, low = 0, high = 100) =>
  Math.min(high, Math.max(low, n));
export function quality(attempts: number, hint: number) {
  return (
    (attempts <= 1 ? 1 : attempts === 2 ? 0.8 : 0.6) *
    RULES.hints[clamp(hint, 0, 4)]
  );
}
export function score(difficulty: Difficulty, attempts: number, hint: number) {
  return Math.max(
    0,
    Math.floor(RULES.xp[difficulty] * quality(attempts, hint)),
  );
}
export type Evidence = {
  questionId: string;
  topicId: string;
  difficulty: string;
  attempts: number;
  hintLevel: number;
  correct: boolean;
  completedAt: Date;
  xp: number;
};
export function mastery(evidence: Evidence[]) {
  // One latest observation per question: repeating an easy item cannot inflate coverage.
  const unique = [
    ...new Map(
      [...evidence]
        .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
        .map((e) => [e.questionId, e]),
    ).values(),
  ]
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, 20);
  if (!unique.length) return 0;
  let sum = 0,
    weights = 0;
  unique.forEach((e, i) => {
    const weight = Math.pow(0.9, i);
    weights += weight;
    sum +=
      weight *
      (e.correct
        ? quality(e.attempts, e.hintLevel) *
          RULES.difficulty[e.difficulty as Difficulty]
        : 0);
  });
  const coverage = Math.min(1, 0.4 + unique.length * 0.2);
  return Math.round(clamp((sum / weights) * 100 * coverage));
}
export function practiceGpa(m: number) {
  for (const [threshold, gpa] of [
    [95, 4],
    [90, 3.9],
    [85, 3.7],
    [80, 3.3],
    [75, 3],
    [70, 2.7],
    [65, 2.3],
    [60, 2],
    [55, 1.7],
    [50, 1.3],
    [40, 1],
  ])
    if (m >= threshold) return gpa;
  return 0;
}
export function masteryLabel(m: number) {
  return m >= 95
    ? "Освоено"
    : m >= 80
      ? "Сильное понимание"
      : m >= 60
        ? "Уверенно"
        : m >= 30
          ? "Изучаю"
          : "Начальный уровень";
}
export function topicState(m: number, read: boolean, solvedQuestions: number) {
  return m >= 95
    ? "MASTERED"
    : solvedQuestions >= RULES.practicedQuestions
      ? "PRACTICED"
      : read
        ? "LEARNING"
        : "NOT_STARTED";
}
export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
export function streak(
  evidence: Evidence[],
  reads: { topicId: string; readAt: Date | null }[],
  now = new Date(),
) {
  const days = new Map<string, Set<string>>();
  evidence
    .filter((e) => e.correct)
    .forEach((e) => {
      const d = dayKey(e.completedAt);
      const set = days.get(d) ?? new Set();
      set.add(e.questionId);
      days.set(d, set);
    });
  const qualifies = (d: string) =>
    (days.get(d)?.size ?? 0) >= RULES.streakCount ||
    reads.some(
      (r) =>
        r.readAt &&
        dayKey(r.readAt) === d &&
        evidence.some(
          (e) =>
            e.correct && e.topicId === r.topicId && dayKey(e.completedAt) === d,
        ),
    );
  const cursor = new Date(dayKey(now));
  if (!qualifies(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let count = 0;
  while (qualifies(dayKey(cursor))) {
    count++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}
export function eligible(evidence: Evidence[]) {
  const correct = evidence.filter((e) => e.correct);
  return (
    new Set(correct.map((e) => e.questionId)).size >= RULES.eligibleSolved &&
    new Set(correct.map((e) => e.topicId)).size >= RULES.eligibleTopics
  );
}
export function publicIdentity(user: {
  id: string;
  firstName: string;
  username: string | null;
  photoUrl: string | null;
  settings: {
    showUsername: boolean;
    showPhoto: boolean;
    leaderboard: boolean;
  } | null;
}) {
  if (!user.settings?.leaderboard) return null;
  return {
    id: user.id,
    name: user.firstName,
    username: user.settings.showUsername ? user.username : null,
    photoUrl: user.settings.showPhoto ? user.photoUrl : null,
  };
}
export function checkAnswer(type: string, expected: unknown, actual: unknown) {
  if (type === "NUMERIC") {
    const number =
      typeof actual === "string" && actual.trim() !== ""
        ? Number(actual.replace(",", "."))
        : NaN;
    return (
      Number.isFinite(number) &&
      Math.abs(number - Number(expected)) <=
        1e-6 * Math.max(1, Math.abs(Number(expected)))
    );
  }
  if (type === "MULTI_SELECT" || type === "STEPS") {
    if (
      !Array.isArray(actual) ||
      !Array.isArray(expected) ||
      actual.length !== expected.length
    )
      return false;
    const a = actual.map(String),
      b = expected.map(String);
    if (type === "MULTI_SELECT") {
      a.sort();
      b.sort();
    }
    return a.every((v, i) => normalize(v) === normalize(b[i]));
  }
  if (type === "FIX_CODE" || type === "OUTPUT") {
    const choices = Array.isArray(expected) ? expected : [expected];
    return (
      typeof actual === "string" &&
      choices.some((v) => String(v).trim() === actual.trim())
    );
  }
  const choices = Array.isArray(expected) ? expected : [expected];
  return (
    typeof actual === "string" &&
    choices.some((v) => normalize(String(v)) === normalize(actual))
  );
}
function normalize(s: string) {
  return s.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}
export function dailySelection<
  T extends { id: string; topicId: string; selectionPriority?: number },
>(
  questions: T[],
  topics: {
    id: string;
    mastery: number;
    started: boolean;
    lastPractice: Date | null;
    readAt: Date | null;
    assessed?: boolean;
    mistakes?: number;
  }[],
  key: string,
) {
  const hash = (s: string) =>
    [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const priority = (id: string) => {
    const t = topics.find((t) => t.id === id);
    if (!t?.started) return 10;
    return (
      100 -
      t.mastery +
      (t.readAt
        ? Math.max(
            0,
            15 -
              Math.max(
                0,
                (new Date(key).getTime() - t.readAt.getTime()) / 86400000,
              ),
          )
        : 0) +
      (t.lastPractice
        ? Math.min(
            30,
            Math.max(
              0,
              (new Date(key).getTime() - t.lastPractice.getTime()) / 86400000,
            ),
          )
        : 30)
    );
  };
  const sorted = [...questions].sort(
    (a, b) =>
      (a.selectionPriority ?? 0) - (b.selectionPriority ?? 0) ||
      priority(b.topicId) - priority(a.topicId) ||
      hash(key + a.id) - hash(key + b.id),
  );
  const selected: T[] = [],
    seen = new Set<string>();
  const pick = (pool: T[], count: number) => {
    for (const q of pool) {
      if (selected.length >= RULES.dailyCount || count <= 0) break;
      if (!seen.has(q.topicId)) {
        selected.push(q);
        seen.add(q.topicId);
        count--;
      }
    }
  };
  const topic = (id: string) => topics.find((t) => t.id === id);
  const age = (date: Date | null) =>
    date ? (new Date(key).getTime() - date.getTime()) / 86400000 : Infinity;
  pick(
    sorted.filter((q) => {
      const t = topic(q.topicId);
      return (
        t?.assessed && (t.mistakes ?? 0) > 0 && t.mastery < RULES.weakThreshold
      );
    }),
    2,
  );
  pick(
    sorted.filter((q) => {
      const t = topic(q.topicId);
      return t?.readAt && age(t.readAt) <= 7;
    }),
    1,
  );
  pick(
    sorted.filter((q) => {
      const t = topic(q.topicId);
      return t?.lastPractice && age(t.lastPractice) >= RULES.reviewAfterDays;
    }),
    1,
  );
  for (const q of sorted) {
    if (selected.length >= RULES.dailyCount) break;
    if (!seen.has(q.topicId)) {
      selected.push(q);
      seen.add(q.topicId);
      if (selected.length === RULES.dailyCount) return selected;
    }
  }
  return [...selected, ...sorted.filter((q) => !selected.includes(q))].slice(
    0,
    RULES.dailyCount,
  );
}
