import type { Difficulty } from "./learning";
import { automaticTopicIds } from "./curriculum";

export type BuilderTopic = {
  id: string;
  title: string;
  subjectId: string;
  moduleId: string;
  moduleTitle: string;
  questions: { difficulty: string; type: string; tags: string[] }[];
};
export type BuilderFilters = {
  difficulties: readonly Difficulty[];
  questionTypes: readonly string[];
  patternIds: readonly string[];
};
export const practicePresets = [
  {
    title: "Разминка",
    difficulties: ["EASY"],
    count: 5,
    hintsAllowed: true,
    feedbackMode: "immediate",
    goal: "reinforce",
  },
  {
    title: "Обычная",
    difficulties: ["EASY", "MEDIUM"],
    count: 10,
    hintsAllowed: true,
    feedbackMode: "immediate",
    goal: "reinforce",
  },
  {
    title: "К семинару",
    difficulties: ["MEDIUM", "HARD"],
    count: 10,
    hintsAllowed: true,
    feedbackMode: "immediate",
    goal: "seminar",
  },
  {
    title: "К экзамену",
    difficulties: ["HARD", "CHALLENGE"],
    count: 15,
    hintsAllowed: false,
    feedbackMode: "end",
    goal: "exam",
  },
] as const;
export const practiceGoals = [
  {
    id: "reinforce",
    title: "Закрепить тему",
    hintsAllowed: true,
    feedbackMode: "immediate",
  },
  {
    id: "check",
    title: "Проверить знания",
    hintsAllowed: false,
    feedbackMode: "end",
  },
  {
    id: "seminar",
    title: "Подготовиться к семинару",
    hintsAllowed: true,
    feedbackMode: "immediate",
  },
  {
    id: "exam",
    title: "Подготовиться к экзамену",
    hintsAllowed: false,
    feedbackMode: "end",
  },
] as const;
export type PracticeGoal = (typeof practiceGoals)[number]["id"];

export function selectionForSubject(
  topics: BuilderTopic[],
  subjectId: string,
  selected: {
    topicIds: string[];
    patternIds: string[];
    questionTypes: string[];
  },
) {
  const scope = topics.filter((t) => !subjectId || t.subjectId === subjectId);
  const topicIds = selected.topicIds.filter((id) =>
    scope.some((t) => t.id === id),
  );
  const effective = scope.filter(
    (t) => !topicIds.length || topicIds.includes(t.id),
  );
  return {
    topicIds,
    patternIds: selected.patternIds.filter((id) =>
      effective.some((t) => t.questions.some((q) => q.tags.includes(id))),
    ),
    questionTypes: selected.questionTypes.filter((type) =>
      scope.some((t) => t.questions.some((q) => q.type === type)),
    ),
  };
}

export function matchingQuestionCount(
  topic: BuilderTopic,
  filters: BuilderFilters,
) {
  return topic.questions.filter(
    (q) =>
      filters.difficulties.includes(q.difficulty as Difficulty) &&
      filters.questionTypes.includes(q.type) &&
      (!filters.patternIds.length ||
        filters.patternIds.some((id) => q.tags.includes(id))),
  ).length;
}

// Keep the established automatic curriculum boundary. Manual selection still
// exposes supplementary/future topics. Pick in curriculum order until enough
// matching questions are covered, without relaxing any filter.
export function suggestBuilderTopics(
  topics: BuilderTopic[],
  filters: BuilderFilters,
  count: number,
) {
  const eligible = new Set(automaticTopicIds);
  const selected: string[] = [];
  let available = 0;
  for (const topic of topics) {
    const matches = matchingQuestionCount(topic, filters);
    if (!eligible.has(topic.id) || !matches) continue;
    selected.push(topic.id);
    available += matches;
    if (available >= count || selected.length === 100) break;
  }
  return selected;
}
