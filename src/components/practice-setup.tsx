import { db } from "@/lib/db";
import { readPracticeConfig } from "@/lib/practice-service";
import { PracticeBuilder } from "./practice-builder";

export type PracticeQuery = {
  subject?: string;
  topic?: string;
  edit?: string;
  harder?: string;
};
export async function PracticeSetup({
  userId,
  query,
  headingLevel = 2,
}: {
  userId: string;
  query: PracticeQuery;
  headingLevel?: 1 | 2;
}) {
  const [subjects, topics, editSession] = await Promise.all([
    db.subject.findMany({
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    }),
    db.topic.findMany({
      select: {
        id: true,
        title: true,
        module: { select: { id: true, title: true, subjectId: true } },
        questions: { select: { difficulty: true, type: true, tags: true } },
      },
      orderBy: [
        { module: { subject: { order: "asc" } } },
        { module: { order: "asc" } },
        { order: "asc" },
        { id: "asc" },
      ],
    }),
    query.edit
      ? db.practiceSession.findFirst({
          where: { id: query.edit, userId },
          select: { config: true },
        })
      : null,
  ]);
  const initialConfig = editSession
    ? readPracticeConfig(editSession.config)
    : null;
  if (initialConfig && query.harder === "1") {
    const next = {
      EASY: "MEDIUM",
      MEDIUM: "HARD",
      HARD: "CHALLENGE",
      CHALLENGE: "CHALLENGE",
    } as const;
    initialConfig.difficulties = [
      ...new Set(initialConfig.difficulties.map((level) => next[level])),
    ];
  }
  return (
    <PracticeBuilder
      headingLevel={headingLevel}
      initialConfig={initialConfig}
      initialSubjectId={
        topics.find((topic) => topic.id === query.topic)?.module.subjectId ??
        (subjects.some((subject) => subject.id === query.subject)
          ? query.subject
          : "")
      }
      initialTopicId={
        topics.some((topic) => topic.id === query.topic) ? query.topic : ""
      }
      subjects={subjects}
      topics={topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        subjectId: topic.module.subjectId,
        moduleId: topic.module.id,
        moduleTitle: topic.module.title,
        questions: topic.questions,
      }))}
    />
  );
}
