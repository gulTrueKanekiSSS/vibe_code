import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import {
  finishPractice,
  PracticeError,
  revealHint,
  serial,
  startPractice,
  submitPractice,
} from "../src/lib/practice-service";
import { getProgress } from "../src/lib/progress";
import { protectedTutorReason } from "../src/lib/tutor-context";

const users: string[] = [];
async function learner() {
  const user = await db.user.create({
    data: {
      telegramId: `test-finish-${randomUUID()}`,
      firstName: "Finish test",
    },
  });
  users.push(user.id);
  return user.id;
}
async function session(userId: string, mode = "topic") {
  const id = await startPractice(
    userId,
    mode,
    "projection",
    undefined,
    randomUUID(),
  );
  return db.practiceSession.findUniqueOrThrow({
    where: { id },
    include: {
      items: { orderBy: { position: "asc" }, include: { question: true } },
    },
  });
}
async function persisted(userId: string, sessionId: string) {
  return {
    items: await db.practiceItem.findMany({
      where: { sessionId },
      orderBy: { position: "asc" },
      include: { submissions: { orderBy: { id: "asc" } } },
    }),
    progress: await db.topicProgress.findMany({
      where: { userId },
      orderBy: { topicId: "asc" },
    }),
  };
}
after(async () => {
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

for (const mode of ["topic", "exam"]) {
  test(`early finish of untouched ${mode} session creates no learning evidence`, async () => {
    const userId = await learner(),
      current = await session(userId, mode);
    const before = await persisted(userId, current.id);
    assert.deepEqual(await finishPractice(userId, current.id), {
      sessionId: current.id,
    });
    assert.ok(
      (
        await db.practiceSession.findUniqueOrThrow({
          where: { id: current.id },
        })
      ).finishedAt,
    );
    assert.deepEqual(await persisted(userId, current.id), before);
    const progress = await getProgress(userId);
    assert.equal(progress.evidence.length, 0);
    assert.equal(progress.xp, 0);
    assert.equal(progress.overall, null);
    assert.equal(progress.gpa, null);
  });

  test(`early finish of partial ${mode} session preserves completed results and excludes skipped items`, async () => {
    const userId = await learner(),
      current = await session(userId, mode);
    const first = current.items[0],
      second = current.items[1];
    const key = randomUUID();
    const accepted = await submitPractice(
      userId,
      first.id,
      key,
      first.question.answer!,
    );
    // In regular practice, an unsuccessful first attempt is still incomplete.
    // Closing must preserve that attempt without turning it into a completed mistake.
    if (mode === "topic") {
      await revealHint(userId, second.id);
      await submitPractice(
        userId,
        second.id,
        randomUUID(),
        "incorrect-test-answer",
      );
    }
    const before = await persisted(userId, current.id);
    await finishPractice(userId, current.id);
    assert.deepEqual(await persisted(userId, current.id), before);
    const progress = await getProgress(userId);
    assert.equal(progress.evidence.length, 1);
    assert.equal(progress.evidence[0].questionId, first.questionId);
    assert.equal(progress.xp, before.items[0].xp);
    assert.deepEqual(
      await submitPractice(userId, first.id, key, first.question.answer!),
      accepted,
    );
    // Existing completed-item retries stay read-only as before.
    assert.deepEqual(
      await submitPractice(userId, first.id, randomUUID(), "ignored"),
      accepted,
    );
    await assert.rejects(
      submitPractice(userId, second.id, randomUUID(), second.question.answer!),
      /Сессия уже завершена/,
    );
    await assert.rejects(revealHint(userId, second.id), /Подсказка недоступна/);
    assert.deepEqual(await persisted(userId, current.id), before);
  });
}

test("finish is owner scoped, rejects missing sessions and is concurrent/idempotent without timestamp changes", async () => {
  const userId = await learner(),
    otherId = await learner(),
    current = await session(userId);
  await assert.rejects(
    finishPractice(otherId, current.id),
    /Сессия не найдена/,
  );
  await assert.rejects(
    finishPractice(userId, "missing-session"),
    /Сессия не найдена/,
  );
  assert.equal(
    (await db.practiceSession.findUniqueOrThrow({ where: { id: current.id } }))
      .finishedAt,
    null,
  );
  const closed = await Promise.all(
    Array.from({ length: 4 }, () => finishPractice(userId, current.id)),
  );
  assert.ok(closed.every((result) => result.sessionId === current.id));
  const timestamp = (
    await db.practiceSession.findUniqueOrThrow({ where: { id: current.id } })
  ).finishedAt;
  await finishPractice(userId, current.id);
  assert.deepEqual(
    (await db.practiceSession.findUniqueOrThrow({ where: { id: current.id } }))
      .finishedAt,
    timestamp,
  );
  assert.equal(
    (await persisted(userId, current.id)).items.every(
      (item) => item.attempts === 0,
    ),
    true,
  );
});

test("Tutor stays blocked until the last protected session is explicitly closed", async () => {
  const userId = await learner();
  const exam = await session(userId, "exam");
  const delayed = await startPractice(
    userId,
    "custom",
    undefined,
    undefined,
    randomUUID(),
    {
      topicIds: ["projection"],
      difficulties: ["EASY", "MEDIUM", "HARD", "CHALLENGE"],
      count: 2,
      hintsAllowed: false,
      feedbackMode: "end",
    },
  );
  const regular = await session(userId);
  assert.ok(await protectedTutorReason(userId));
  await finishPractice(userId, exam.id);
  assert.ok(await protectedTutorReason(userId));
  await finishPractice(userId, delayed);
  assert.equal(await protectedTutorReason(userId), undefined);
  assert.equal(
    (await db.practiceSession.findUniqueOrThrow({ where: { id: regular.id } }))
      .finishedAt,
    null,
  );
});

test("accepted incomplete-answer replay remains read-only after early finish", async () => {
  const userId = await learner(),
    current = await session(userId);
  const item = current.items[0],
    key = randomUUID();
  const accepted = await submitPractice(
    userId,
    item.id,
    key,
    "incorrect-test-answer",
  );
  assert.equal(accepted.finished, false);
  await finishPractice(userId, current.id);
  const before = await persisted(userId, current.id);
  assert.deepEqual(
    await submitPractice(userId, item.id, key, "incorrect-test-answer"),
    accepted,
  );
  await assert.rejects(
    submitPractice(userId, item.id, randomUUID(), item.question.answer!),
    /Сессия уже завершена/,
  );
  assert.deepEqual(await persisted(userId, current.id), before);
});

test("answer and finish serialize; stale requests cannot write after the close", async () => {
  const userId = await learner(),
    current = await session(userId),
    item = current.items[0];
  // Hold the same mutation lock, so both requests queue before either can write.
  let release!: () => void, entered!: () => void;
  const locked = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const blocker = serial(userId, async () => {
    entered();
    await gate;
  });
  await locked;
  const finish = finishPractice(userId, current.id);
  const answer = submitPractice(
    userId,
    item.id,
    randomUUID(),
    item.question.answer!,
  );
  const resultPromise = Promise.allSettled([finish, answer]);
  release();
  await blocker;
  const results = await resultPromise;
  assert.equal(results[0].status, "fulfilled");
  const savedSession = await db.practiceSession.findUniqueOrThrow({
    where: { id: current.id },
  });
  const saved = await db.practiceItem.findUniqueOrThrow({
    where: { id: item.id },
    include: { submissions: true },
  });
  assert.ok(savedSession.finishedAt);
  // Connection scheduling may deliver the answer first; either ordering must be atomic.
  if (results[1].status === "fulfilled") {
    assert.equal(saved.submissions.length, 1);
    assert.ok(
      saved.completedAt && saved.completedAt <= savedSession.finishedAt,
    );
  } else {
    assert.ok(results[1].reason instanceof PracticeError);
    assert.equal(saved.submissions.length, 0);
    assert.equal(saved.attempts, 0);
    assert.equal(saved.completedAt, null);
  }
  const before = await persisted(userId, current.id);
  await assert.rejects(
    submitPractice(userId, current.items[1].id, randomUUID(), "late"),
    /Сессия уже завершена/,
  );
  await assert.rejects(
    revealHint(userId, current.items[1].id),
    /Подсказка недоступна/,
  );
  await finishPractice(userId, current.id);
  assert.deepEqual(await persisted(userId, current.id), before);
  assert.deepEqual(
    (await db.practiceSession.findUniqueOrThrow({ where: { id: current.id } }))
      .finishedAt,
    savedSession.finishedAt,
  );
});
