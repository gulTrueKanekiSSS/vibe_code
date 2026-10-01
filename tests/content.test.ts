import { test } from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { loadContent, section, parseLesson } from "../src/lib/content-source";
test("MDX source loads five subjects, unique topics and one question file per topic", async () => {
  const { subjects, lessons, questions } = await loadContent();
  assert.equal(subjects.length, 5);
  assert.ok(lessons.length >= 64);
  assert.ok(questions.length >= 200, "University bank milestone 1");
  assert.equal(new Set(lessons.map((l) => l.metadata.id)).size, lessons.length);
  for (const lesson of lessons) {
    assert.ok(questions.some((q) => q.topicId === lesson.metadata.id));
    assert.ok((section(lesson, "Что это?") ?? "").length > 50);
    assert.ok(section(lesson, "Разберём на примере"));
    assert.ok(section(lesson, "Частая ошибка"));
  }
  assert.equal(new Set(questions.map((q) => q.type)).size, 9);
  for (const question of questions) {
    assert.ok(question.solution.length >= 35, `Short solution: ${question.id}`);
    assert.equal(
      new Set(question.hints).size,
      3,
      `Repeated hint: ${question.id}`,
    );
    if (["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(question.type))
      assert.ok(
        question.options.includes(question.answer as string),
        `Answer not in options: ${question.id}`,
      );
    if (question.type === "MULTI_SELECT")
      assert.ok(
        (question.answer as string[]).every((answer) =>
          question.options.includes(answer),
        ),
        `Answer not in options: ${question.id}`,
      );
  }
  for (const id of [
    "projection",
    "determinants",
    "supremum",
    "nand",
    "pointer-arithmetic",
    "quantifiers",
    "dot-product",
    "boolean",
    "completeness",
    "pointers",
    "implication",
  ]) {
    const lesson = lessons.find((l) => l.metadata.id === id)!;
    assert.ok(section(lesson, "Formal Definition"));
    assert.ok(section(lesson, "Пример уровня университета"));
    assert.ok(section(lesson, "Пример-ловушка"));
    assert.ok(section(lesson, "Связи с другими темами"));
    const levels = new Set(
      questions.filter((q) => q.topicId === id).map((q) => q.difficulty),
    );
    assert.deepEqual(levels, new Set(["EASY", "MEDIUM", "HARD", "CHALLENGE"]));
    for (const part of lesson.sections)
      for (const match of part.text.matchAll(/(?<!\$)\$([^$\n]+)\$(?!\$)/g))
        assert.doesNotThrow(() =>
          katex.renderToString(match[1], { throwOnError: true }),
        );
  }
});
test("math in MDX preserves LaTeX and renders; invalid frontmatter fails", async () => {
  const { lessons } = await loadContent();
  const projection = lessons.find((l) => l.metadata.id === "projection")!;
  assert.ok(section(projection, "Формула и её смысл")?.includes("\\frac"));
  for (const lesson of lessons) {
    const raw = section(lesson, "Формула и её смысл"),
      latex = raw?.match(/\$\$\s*([\s\S]*?)\s*\$\$/)?.[1];
    if (latex)
      assert.doesNotThrow(() =>
        katex.renderToString(latex, { throwOnError: true }),
      );
  }
  assert.throws(() => parseLesson("---\n{}\n---\n\n## Что это?\n\nПример"));
});
