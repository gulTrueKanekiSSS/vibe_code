import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  validateContentDirectory,
  validateLesson,
  validateQuestionBank,
} from "../scripts/content-validation";

const meta = {
  id: "sample",
  title: "Тема",
  english: "Topic",
  subject: "analysis",
  module: "Основы",
  order: 0,
  difficulty: "EASY",
  estimatedMinutes: 5,
  prerequisites: [],
  keywords: [],
  quizAnswer: "2",
};
const lesson = (changes = {}) =>
  `---\n${JSON.stringify({ ...meta, ...changes })}\n---\n## Что это?\nПодробное объяснение понятия: сложение объединяет количества двух непересекающихся групп.\n## Разберём на примере\nОдин предмет и ещё один дают два.\n## Частая ошибка\nНе путайте сложение с умножением.\n`;
const question = {
  id: "sample-q",
  topicId: "sample",
  type: "NUMERIC",
  difficulty: "EASY",
  prompt: "Сколько будет один плюс один?",
  options: [],
  answer: "2",
  solution:
    "Считаем два предмета вместе: один и ещё один дают два, поэтому ответ равен 2.",
  hints: [
    "Подумайте о количестве.",
    "Объедините две группы.",
    "Сосчитайте все предметы.",
  ],
  tags: [],
};

test("question validation rejects missing/blank teaching data and unsupported enums", () => {
  for (const change of [
    { answer: undefined },
    { answer: " " },
    { answer: [] },
    { type: "SHORT_TEXT", answer: [""] },
    { prompt: " " },
    { solution: undefined },
    { solution: " ".repeat(40) },
    { hints: ["a", "b"] },
    { hints: ["a", " a ", "b"] },
    { hints: ["a", "b", " "] },
    { difficulty: "EXTREME" },
    { type: "ESSAY" },
    { type: "MULTIPLE_CHOICE", options: ["2", "3"], answer: "4" },
    { type: "MULTI_SELECT", options: ["2", "3"], answer: ["2", "2"] },
    { type: "STEPS", options: ["step 1", "step 2"], answer: ["1"] },
    { type: "TRUE_FALSE", options: ["yes"], answer: "yes" },
    { explanation: "wrong field" },
  ])
    assert.throws(
      () => validateQuestionBank([{ ...question, ...change }]),
      JSON.stringify(change),
    );
  assert.equal(validateQuestionBank([question]).length, 1);
  assert.throws(() => validateQuestionBank([]));
});

test("lesson metadata, required sections and duplicate headings", () => {
  assert.equal(validateLesson(lesson()).metadata.id, "sample");
  assert.throws(() => validateLesson(lesson({ difficulty: "UNKNOWN" })));
  assert.throws(() => validateLesson(lesson({ title: " " })));
  assert.throws(() => validateLesson(lesson({ extra: "ignored otherwise" })));
  assert.throws(() =>
    validateLesson(lesson().replace("## Частая ошибка", "## Other")),
  );
  assert.throws(() => validateLesson(lesson() + "\n## Что это?\nDuplicate"));
});

test("directory validation checks complete registry and cross-file references without a database", async () => {
  const root = await mkdtemp(join(tmpdir(), "studyspace-validation-"));
  try {
    for (const kind of ["lessons", "questions"])
      await mkdir(join(root, kind, "analysis"), { recursive: true });
    const subject = {
      id: "analysis",
      title: "Анализ",
      english: "Analysis",
      description: "",
      icon: "",
      color: "",
      modules: ["Основы"],
    };
    const subjects = join(root, "subjects.json"),
      mdx = join(root, "lessons/analysis/sample.mdx"),
      bank = join(root, "questions/analysis/sample.json");
    await writeFile(subjects, JSON.stringify([subject]));
    await writeFile(mdx, lesson());
    await writeFile(bank, JSON.stringify([question]));
    assert.equal((await validateContentDirectory(root)).questions.length, 1);
    for (const change of [
      { subject: "unknown" },
      { module: "unknown" },
      { id: "wrong" },
      { prerequisites: ["unknown"] },
    ]) {
      await writeFile(mdx, lesson(change));
      await assert.rejects(validateContentDirectory(root));
    }
    await writeFile(mdx, lesson());
    for (const bankValue of [
      [{ ...question, topicId: "unknown" }],
      [question, { ...question, prompt: "Другой вопрос" }],
      [question, { ...question, id: "second" }],
    ]) {
      await writeFile(bank, JSON.stringify(bankValue));
      await assert.rejects(validateContentDirectory(root));
    }
    await writeFile(bank, JSON.stringify([question]));
    await writeFile(subjects, JSON.stringify([subject, subject]));
    await assert.rejects(validateContentDirectory(root), /Duplicate subject/);
    await writeFile(subjects, JSON.stringify([subject]));
    const orphan = join(root, "questions/analysis/orphan.json");
    await writeFile(orphan, JSON.stringify([question]));
    await assert.rejects(validateContentDirectory(root), /Unknown topic/);
    await rm(orphan);
    await mkdir(join(root, "questions/unknown"));
    await assert.rejects(validateContentDirectory(root), /Unknown subject/);
    await rm(join(root, "questions/unknown"), { recursive: true });
    // Topic IDs are global, even across different subjects.
    await writeFile(
      subjects,
      JSON.stringify([subject, { ...subject, id: "second" }]),
    );
    for (const kind of ["lessons", "questions"])
      await mkdir(join(root, kind, "second"));
    await writeFile(
      join(root, "lessons/second/sample.mdx"),
      lesson({ subject: "second" }),
    );
    await writeFile(
      join(root, "questions/second/sample.json"),
      JSON.stringify([
        { ...question, id: "second-q", prompt: "Другой вопрос" },
      ]),
    );
    await assert.rejects(validateContentDirectory(root), /Duplicate lesson ID/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("CONTENT_SCHEMA examples pass the actual validators", async () => {
  const doc = await readFile("CONTENT_SCHEMA.md", "utf8");
  const mdx = /```mdx\n([\s\S]*?)\n```/.exec(doc)?.[1];
  const json = /```json\n([\s\S]*?)\n```/.exec(doc)?.[1];
  assert.ok(mdx);
  assert.ok(json);
  const parsed = validateLesson(mdx + "\n");
  const [q] = validateQuestionBank(JSON.parse(json));
  assert.equal(q.topicId, parsed.metadata.id);
});
