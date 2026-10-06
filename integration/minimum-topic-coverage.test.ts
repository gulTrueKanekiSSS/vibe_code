import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { loadContent } from "../src/lib/content-source";
import { startPractice, submitPractice } from "../src/lib/practice-service";
import type { Difficulty } from "../src/lib/learning";

const created: string[] = [];
after(async () => {
  await db.user.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
});

test("all expanded question records are seeded without changing their content", async () => {
  const { questions } = await loadContent();
  const added = questions.filter((q) => q.id.includes("-min10-"));
  assert.equal(added.length, 390);
  const saved = await db.question.findMany({
    where: { id: { in: added.map((q) => q.id) } },
  });
  assert.equal(saved.length, added.length);
  const byId = new Map(saved.map((q) => [q.id, q]));
  for (const source of added) {
    const row = byId.get(source.id)!;
    for (const key of [
      "topicId",
      "type",
      "difficulty",
      "prompt",
      "options",
      "answer",
      "solution",
      "hints",
      "feedback",
      "tags",
    ] as const)
      assert.deepEqual(
        row[key],
        key === "feedback" ? (source.feedback ?? {}) : source[key],
        source.id + " " + key,
      );
  }
});

test("every existing topic starts ten distinct resumable questions through both topic and custom practice", async () => {
  const { lessons, subjects } = await loadContent();
  assert.equal(lessons.length, 64);
  for (const subject of subjects) {
    // One learner per subject keeps this below the unchanged 30-start/hour limit.
    const user = await db.user.create({
      data: {
        telegramId: "test-minimum-" + randomUUID(),
        firstName: "Coverage test",
        settings: { create: {} },
      },
    });
    created.push(user.id);
    for (const lesson of lessons.filter(
      (l) => l.metadata.subject === subject.id,
    )) {
      const topicId = lesson.metadata.id;
      const key = randomUUID();
      const options = {
        topicIds: [topicId],
        difficulties: ["EASY", "MEDIUM", "HARD", "CHALLENGE"] as Difficulty[],
        count: 10,
      };
      const sessionId = await startPractice(
        user.id,
        "custom",
        undefined,
        subject.id,
        key,
        options,
      );
      const load = () =>
        db.practiceSession.findFirstOrThrow({
          where: { id: sessionId, userId: user.id },
          include: {
            items: {
              include: { question: true },
              orderBy: { position: "asc" },
            },
          },
        });
      const session = await load();
      assert.equal(session.items.length, 10, topicId);
      assert.equal(
        new Set(session.items.map((i) => i.questionId)).size,
        10,
        topicId,
      );
      assert.ok(
        session.items.every(
          (i) => i.question.topicId === topicId && i.question.prompt.length > 0,
        ),
        topicId,
      );
      assert.deepEqual(
        session.items.map((i) => i.position),
        Array.from({ length: 10 }, (_, i) => i),
      );
      assert.equal(
        await startPractice(
          user.id,
          "custom",
          undefined,
          subject.id,
          key,
          options,
        ),
        sessionId,
      );
      const first = session.items[0];
      const result = await submitPractice(
        user.id,
        first.id,
        randomUUID(),
        first.question.answer!,
      );
      assert.equal(result.correct, true, first.questionId);
      const reloaded = await load();
      assert.deepEqual(
        reloaded.items.map((i) => i.id),
        session.items.map((i) => i.id),
      );
      assert.equal(reloaded.items[0].correct, true);
      assert.ok(reloaded.items[0].completedAt);
      const topicSession = await startPractice(
        user.id,
        "topic",
        topicId,
        undefined,
        randomUUID(),
      );
      const topicItems = await db.practiceItem.findMany({
        where: { sessionId: topicSession },
        include: { question: true },
      });
      assert.equal(topicItems.length, 10, topicId + " topic start");
      assert.equal(new Set(topicItems.map((i) => i.questionId)).size, 10);
      assert.ok(topicItems.every((i) => i.question.topicId === topicId));
    }
    assert.equal(
      await db.practiceSession.count({ where: { userId: user.id } }),
      2 * lessons.filter((l) => l.metadata.subject === subject.id).length,
    );
  }
});
