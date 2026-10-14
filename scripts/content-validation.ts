import { lstat, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import {
  metadataSchema,
  parseLesson,
  questionSchema,
  subjectSchema,
  type SourceLesson,
  type SourceQuestion,
} from "../src/lib/content-source";

// Supplement the runtime parser, without changing application/seed behavior.
export function validateLesson(source: string): SourceLesson {
  const lesson = parseLesson(source);
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source)!;
  metadataSchema.strict().parse(JSON.parse(frontmatter[1]));
  for (const field of ["title", "english", "subject", "module"] as const)
    if (!lesson.metadata[field].trim())
      throw new Error(`Empty lesson ${field}`);
  const titles = lesson.sections.map((s) => s.title);
  if (new Set(titles).size !== titles.length)
    throw new Error("Duplicate lesson section");
  for (const title of ["Что это?", "Разберём на примере", "Частая ошибка"])
    if (!lesson.sections.some((s) => s.title === title && s.text.trim()))
      throw new Error(`Missing lesson section: ${title}`);
  if (lesson.sections.find((s) => s.title === "Что это?")!.text.length <= 50)
    throw new Error("Lesson explanation must be longer than 50 characters");
  return lesson;
}

export function validateQuestionBank(value: unknown): SourceQuestion[] {
  const questions = z.array(questionSchema.strict()).min(1).parse(value);
  for (const q of questions) {
    const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
    if (!answers.length || answers.some((a) => !a.trim()))
      throw new Error(`${q.id}: Missing answer`);
    if (!q.prompt.trim()) throw new Error(`${q.id}: Missing prompt`);
    if (q.solution.trim().length < 35)
      throw new Error(
        `${q.id}: Missing explanation/full solution (solution requires 35 characters)`,
      );
    if (
      q.hints.some((h) => !h.trim()) ||
      new Set(q.hints.map((h) => h.trim().toLowerCase())).size !== 3
    )
      throw new Error(`${q.id}: Need exactly three distinct nonempty hints`);
    if (q.options.some((o) => !o.trim()))
      throw new Error(`${q.id}: Empty option`);
    if (
      ["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTI_SELECT"].includes(q.type) &&
      q.options.length < 2
    )
      throw new Error(`${q.id}: Choice question needs at least two options`);
    if (q.type === "TRUE_FALSE" && q.options.length !== 2)
      throw new Error(`${q.id}: True/false needs exactly two options`);
  }
  return questions;
}

async function entries(path: string, directories: boolean) {
  const files = (await readdir(path, { withFileTypes: true })).filter(
    (f) => f.name !== ".gitkeep",
  );
  for (const file of files)
    if (
      file.isSymbolicLink() ||
      (directories ? !file.isDirectory() : !file.isFile())
    )
      throw new Error(`Unsupported file or symlink: ${join(path, file.name)}`);
  return files.map((f) => f.name).sort();
}

async function regular(path: string, directory = false) {
  const stat = await lstat(path);
  if (
    stat.isSymbolicLink() ||
    (directory ? !stat.isDirectory() : !stat.isFile())
  )
    throw new Error(`Unsupported file or symlink: ${path}`);
}

export async function validateContentDirectory(root: string) {
  await regular(root, true);
  await regular(join(root, "subjects.json"));
  const subjects = z
    .array(subjectSchema.strict())
    .min(1)
    .parse(JSON.parse(await readFile(join(root, "subjects.json"), "utf8")));
  if (new Set(subjects.map((s) => s.id)).size !== subjects.length)
    throw new Error("Duplicate subject ID");
  for (const subject of subjects)
    if (
      subject.modules.some((m) => !m.trim()) ||
      new Set(subject.modules).size !== subject.modules.length
    )
      throw new Error(`Invalid or duplicate modules: ${subject.id}`);
  for (const kind of ["lessons", "questions"]) {
    await regular(join(root, kind), true);
    for (const subject of await entries(join(root, kind), true))
      if (!subjects.some((s) => s.id === subject))
        throw new Error(`Unknown subject: ${kind}/${subject}`);
  }
  const lessons: SourceLesson[] = [];
  const questions: SourceQuestion[] = [];
  for (const subject of subjects) {
    const lessonDir = join(root, "lessons", subject.id);
    const questionDir = join(root, "questions", subject.id);
    const lessonFiles = await entries(lessonDir, false);
    const questionFiles = new Set(await entries(questionDir, false));
    for (const file of lessonFiles) {
      const path = join(lessonDir, file);
      try {
        if (!file.endsWith(".mdx")) throw new Error("Expected .mdx lesson");
        const lesson = validateLesson(await readFile(path, "utf8"));
        const m = lesson.metadata;
        if (
          m.id !== file.slice(0, -4) ||
          m.subject !== subject.id ||
          !subject.modules.includes(m.module)
        )
          throw new Error("Invalid lesson ID/subject/module reference");
        lessons.push(lesson);
        const bankFile = `${m.id}.json`;
        if (!questionFiles.delete(bankFile))
          throw new Error(`Missing question bank: ${bankFile}`);
        const bank = validateQuestionBank(
          JSON.parse(await readFile(join(questionDir, bankFile), "utf8")),
        );
        if (bank.some((q) => q.topicId !== m.id))
          throw new Error(`Lesson/topic mismatch: ${bankFile}`);
        questions.push(...bank);
      } catch (error) {
        throw new Error(
          `${path}: ${error instanceof Error ? error.message : "Invalid content"}`,
        );
      }
    }
    if (questionFiles.size)
      throw new Error(
        `Unknown topic/question file: ${subject.id}/${[...questionFiles].join(", ")}`,
      );
  }
  if (new Set(lessons.map((l) => l.metadata.id)).size !== lessons.length)
    throw new Error("Duplicate lesson ID");
  if (new Set(questions.map((q) => q.id)).size !== questions.length)
    throw new Error("Duplicate question ID");
  const prompts = questions.map((q) =>
    q.prompt.toLowerCase().replace(/\s+/g, " ").trim(),
  );
  if (new Set(prompts).size !== prompts.length)
    throw new Error("Duplicate question prompt");
  const topics = new Set(lessons.map((l) => l.metadata.id));
  for (const lesson of lessons)
    for (const prerequisite of lesson.metadata.prerequisites)
      if (!topics.has(prerequisite))
        throw new Error(`Unknown prerequisite: ${prerequisite}`);
  return { subjects, lessons, questions };
}
