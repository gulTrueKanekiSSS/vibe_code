import { db } from "./db";
export const getSubjects = () =>
  db.subject.findMany({ orderBy: { order: "asc" } });
export const getSubject = (id: string) =>
  db.subject.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { topics: { orderBy: { order: "asc" } } },
      },
    },
  });
export const getModules = (subjectId: string) =>
  db.module.findMany({ where: { subjectId }, orderBy: { order: "asc" } });
export const getTopics = (subjectId: string) =>
  db.topic.findMany({
    where: { module: { subjectId } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });
export const getTopic = (id: string) =>
  db.topic.findUnique({
    where: { id },
    include: { module: { include: { subject: true } }, formulas: true },
  });
export const getTopicFormulas = (topicId: string) =>
  db.formula.findMany({ where: { topicId } });
export const getTopicQuestions = (topicId: string) =>
  db.question.findMany({
    where: { topicId },
    select: {
      id: true,
      type: true,
      difficulty: true,
      prompt: true,
      options: true,
      tags: true,
    },
  });
export async function searchContent(query: string) {
  const q = query.trim().slice(0, 200);
  if (!q) return { subjects: [], topics: [], formulas: [] };
  const subjects = await db.subject.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { english: { contains: q, mode: "insensitive" } },
      ],
    },
  });
  const topics = await db.topic.findMany({
    include: { module: { include: { subject: true } } },
  });
  const formulas = await db.formula.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { meaning: { contains: q, mode: "insensitive" } },
      ],
    },
  });
  const matches = (value: string) =>
    value.toLocaleLowerCase().includes(q.toLocaleLowerCase());
  return {
    subjects,
    topics: topics.filter(
      (t) =>
        matches(t.title) ||
        matches(t.english) ||
        t.keywords.some(matches) ||
        matches(JSON.stringify(t.content)),
    ),
    formulas,
  };
}
