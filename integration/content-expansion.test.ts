import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { loadContent } from "../src/lib/content-source";
import { startPractice } from "../src/lib/practice-service";

const topics = [
  "vectors",
  "vector-length",
  "orthogonal",
  "independence",
  "sets",
  "half-adder",
  "full-adder",
  "nor",
];
const created: string[] = [];
after(async () => {
  await db.user.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
});
async function learner() {
  const user = await db.user.create({
    data: {
      telegramId: `content-test-${randomUUID()}`,
      firstName: "Content verification",
      settings: { create: {} },
    },
  });
  created.push(user.id);
  return user;
}

test("seeded coverage batch matches source answers, hints, solutions and tags", async () => {
  const { questions } = await loadContent();
  const source = questions.filter(
    (q) => topics.includes(q.topicId) && /-b\d+$/.test(q.id),
  );
  assert.equal(source.length, 120);
  const saved = await db.question.findMany({
    where: { id: { in: source.map((q) => q.id) } },
  });
  assert.equal(
    saved.length,
    source.length,
    "Run npm run db:seed before integration tests",
  );
  for (const q of source) {
    const row = saved.find((r) => r.id === q.id)!;
    for (const key of [
      "topicId",
      "type",
      "difficulty",
      "prompt",
      "options",
      "answer",
      "solution",
      "hints",
      "tags",
    ] as const)
      assert.deepEqual(row[key], q[key], `${q.id}.${key}`);
  }
});

test("each expanded topic opens a persisted session containing usable new questions", async () => {
  const user = await learner();
  for (const topic of topics) {
    const key = randomUUID();
    const id = await startPractice(user.id, "topic", topic, undefined, key);
    const items = await db.practiceItem.findMany({
      where: { sessionId: id },
      orderBy: { position: "asc" },
      include: { question: true },
    });
    assert.ok(items.length > 0, topic);
    assert.ok(
      items.some((item) => /-b\d+$/.test(item.questionId)),
      topic,
    );
    assert.ok(
      items.every(
        (item) =>
          item.question.topicId === topic && item.question.prompt.length > 0,
      ),
    );
    assert.equal(
      new Set(items.map((item) => item.questionId)).size,
      items.length,
    );
    assert.equal(
      await startPractice(user.id, "topic", topic, undefined, key),
      id,
    );
    const reloaded = await db.practiceItem.findMany({
      where: { sessionId: id },
      orderBy: { position: "asc" },
    });
    assert.deepEqual(
      reloaded.map((item) => item.questionId),
      items.map((item) => item.questionId),
    );
  }
});

test("new set and circuit content is selectable through existing semantic filters", async () => {
  const user = await learner();
  for (const [subject, topic, pattern] of [
    ["discrete", "sets", "set-problem"],
    ["architecture", "half-adder", "circuit-design"],
    ["architecture", "full-adder", "circuit-design"],
    ["architecture", "nor", "universal-gates"],
  ]) {
    const id = await startPractice(
      user.id,
      "custom",
      undefined,
      subject,
      randomUUID(),
      {
        topicIds: [topic],
        difficulties: ["EASY", "MEDIUM", "HARD", "CHALLENGE"],
        patternIds: [pattern],
        count: 15,
      },
    );
    const items = await db.practiceItem.findMany({
      where: { sessionId: id },
      include: { question: true },
    });
    assert.equal(items.length, 15, topic);
    assert.ok(
      items.every(
        (item) =>
          item.question.topicId === topic &&
          item.question.tags.includes(pattern),
      ),
    );
    assert.equal(new Set(items.map((item) => item.questionId)).size, 15);
  }
});
