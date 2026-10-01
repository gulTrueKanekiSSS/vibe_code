import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const root = join(process.cwd(), "content");
const subjectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  english: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  modules: z.array(z.string().min(1)).min(1),
});
const metadataSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  english: z.string().min(1),
  subject: z.string(),
  module: z.string(),
  order: z.number().int().nonnegative(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "CHALLENGE"]),
  estimatedMinutes: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  keywords: z.array(z.string()),
  quizAnswer: z.string(),
});
export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    topicId: z.string(),
    type: z.enum([
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
    difficulty: z.enum(["EASY", "MEDIUM", "HARD", "CHALLENGE"]),
    prompt: z.string().min(1),
    options: z.array(z.string()),
    answer: z.union([z.string(), z.array(z.string())]),
    solution: z.string().min(35),
    hints: z.array(z.string().min(1)).length(3),
    tags: z.array(z.string()),
    feedback: z.record(z.string(), z.string()).optional(),
  })
  .superRefine((question, context) => {
    const fail = (message: string) =>
      context.addIssue({
        code: "custom",
        message: `${question.id}: ${message}`,
      });
    if (new Set(question.hints).size !== 3) fail("Hints must be distinct");
    if (new Set(question.options).size !== question.options.length)
      fail("Duplicate options");
    if (
      ["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(question.type) &&
      (typeof question.answer !== "string" ||
        !question.options.includes(question.answer))
    )
      fail("Correct answer must be an available option");
    if (
      question.type === "NUMERIC" &&
      (typeof question.answer !== "string" ||
        !question.answer.trim() ||
        !Number.isFinite(Number(question.answer)))
    )
      fail("Numeric answer must be finite");
    if (
      question.type === "MULTI_SELECT" &&
      (!Array.isArray(question.answer) ||
        !question.answer.length ||
        new Set(question.answer).size !== question.answer.length ||
        !question.answer.every((answer) => question.options.includes(answer)))
    )
      fail("Multi-select answers must be distinct available options");
    if (
      question.type === "STEPS" &&
      (!Array.isArray(question.answer) ||
        !question.answer.length ||
        question.answer.length !== question.options.length)
    )
      fail("Steps need one answer per labelled field");
  });
export type LessonMetadata = z.infer<typeof metadataSchema>;
export type LessonSection = { title: string; text: string };
export type SourceLesson = {
  metadata: LessonMetadata;
  sections: LessonSection[];
};
export type SourceSubject = z.infer<typeof subjectSchema>;
export type SourceQuestion = z.infer<typeof questionSchema>;
export function parseLesson(source: string): SourceLesson {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  if (!match)
    throw new Error("Lesson must start with JSON-compatible YAML frontmatter");
  const metadata = metadataSchema.parse(JSON.parse(match[1]));
  const sections: LessonSection[] = [];
  let current: LessonSection | null = null;
  for (const line of match[2].split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      current = { title: line.slice(3).trim(), text: "" };
      sections.push(current);
    } else if (current) current.text += line + "\n";
  }
  for (const section of sections) section.text = section.text.trim();
  if (
    !sections.some((s) => s.title === "Что это?" && s.text) ||
    !sections.some((s) => s.title === "Разберём на примере" && s.text)
  )
    throw new Error(`Lesson ${metadata.id} needs an explanation and example`);
  return { metadata, sections };
}
export function section(lesson: SourceLesson, title: string) {
  return lesson.sections.find((s) => s.title === title)?.text ?? null;
}
export async function loadContent() {
  const subjects = z
    .array(subjectSchema)
    .parse(JSON.parse(await readFile(join(root, "subjects.json"), "utf8")));
  const lessons: SourceLesson[] = [],
    questions: SourceQuestion[] = [];
  for (const subject of subjects) {
    const files = (await readdir(join(root, "lessons", subject.id)))
      .filter((file) => file.endsWith(".mdx"))
      .sort();
    for (const file of files) {
      const lesson = parseLesson(
        await readFile(join(root, "lessons", subject.id, file), "utf8"),
      );
      if (
        lesson.metadata.id !== file.slice(0, -4) ||
        lesson.metadata.subject !== subject.id ||
        !subject.modules.includes(lesson.metadata.module)
      )
        throw new Error(`Invalid metadata in ${file}`);
      lessons.push(lesson);
      const questionPath = join(
        root,
        "questions",
        subject.id,
        `${lesson.metadata.id}.json`,
      );
      const bank = z
        .array(questionSchema)
        .min(1)
        .parse(JSON.parse(await readFile(questionPath, "utf8")));
      if (bank.some((q) => q.topicId !== lesson.metadata.id))
        throw new Error(`Wrong topicId in ${questionPath}`);
      questions.push(...bank);
    }
  }
  if (new Set(lessons.map((l) => l.metadata.id)).size !== lessons.length)
    throw new Error("Duplicate lesson ID");
  if (new Set(questions.map((q) => q.id)).size !== questions.length)
    throw new Error("Duplicate question ID");
  const normalizedPrompts = questions.map((q) =>
    q.prompt.toLowerCase().replace(/\s+/g, " ").trim(),
  );
  if (new Set(normalizedPrompts).size !== normalizedPrompts.length)
    throw new Error("Duplicate question prompt");
  const topicIds = new Set(lessons.map((lesson) => lesson.metadata.id));
  for (const lesson of lessons)
    for (const prerequisite of lesson.metadata.prerequisites)
      if (!topicIds.has(prerequisite))
        throw new Error(`Unknown prerequisite: ${prerequisite}`);
  return { subjects, lessons, questions };
}
