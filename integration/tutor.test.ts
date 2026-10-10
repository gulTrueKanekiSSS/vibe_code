import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import {
  startPractice,
  revealHint,
  submitPractice,
} from "../src/lib/practice-service";
import { resolveTutorContext } from "../src/lib/tutor-context";
import {
  getTutorSnapshot,
  sendTutorMessage,
  resetTutorConversation,
  type TutorDependencies,
} from "../src/lib/tutor-service";
import type {
  TutorGenerationInput,
  TutorProvider,
  RetrievedChunk,
} from "../src/lib/tutor/types";

const created: string[] = [];
async function user() {
  const value = await db.user.create({
    data: {
      telegramId: `tutor-test-${randomUUID()}`,
      firstName: "PRIVATE_PROFILE_SENTINEL",
    },
  });
  created.push(value.id);
  return value;
}
const source: RetrievedChunk = {
  id: "projection:0",
  title: "Projection",
  topicId: "projection",
  sectionTitle: "Intuition",
  sectionIndex: 0,
  url: "/topics/projection#section-0",
  text: "Проекция описывает компоненту вектора вдоль направления.",
  retrieval: "lexical",
};
function fake(generate?: TutorProvider["generateTutorResponse"]) {
  const calls: TutorGenerationInput[] = [];
  const provider: TutorProvider = {
    embeddingModel: "test",
    embedText: async () => [[1, 0]],
    generateTutorResponse: async (input) => {
      calls.push(input);
      return generate
        ? generate(input)
        : input.context.restricted
          ? { kind: "guided", action: "first-step" }
          : {
              kind: "teaching",
              message:
                "Проекция — компонента вдоль направления. Какое направление выбрано?",
              grounding: "course",
              citationIds: [source.id],
            };
    },
  };
  const deps: TutorDependencies = { provider, retrieve: async () => [source] };
  return { calls, deps };
}
const message = (
  text = "Объясни проще",
  context = { topicId: "projection" } as {
    topicId?: string;
    practiceItemId?: string;
  },
) => ({ context, message: text, requestKey: randomUUID() });
async function item(userId: string) {
  const sessionId = await startPractice(
    userId,
    "topic",
    "projection",
    undefined,
    randomUUID(),
  );
  return db.practiceItem.findFirstOrThrow({
    where: { sessionId },
    orderBy: { position: "asc" },
    include: { question: true },
  });
}
after(async () => {
  await db.user.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
});

test("Tutor persists owned history, citations and idempotent retries without profile data", async () => {
  const u = await user(),
    other = await user(),
    { deps, calls } = fake(),
    body = message();
  const first = await sendTutorMessage(u.id, body, deps);
  assert.equal(first.messages.length, 2);
  assert.equal(
    first.messages[1].sources[0].url,
    "/topics/projection#section-0",
  );
  assert.deepEqual(await sendTutorMessage(u.id, body, deps), first);
  assert.deepEqual(await getTutorSnapshot(u.id, body.context, deps), first);
  assert.equal(
    (await getTutorSnapshot(other.id, body.context, deps)).messages.length,
    0,
  );
  assert.equal(calls.length, 1);
  assert.ok(!JSON.stringify(calls).includes("PRIVATE_PROFILE_SENTINEL"));
  assert.equal(
    (await db.tutorUsage.findUniqueOrThrow({ where: { userId: u.id } })).count,
    1,
  );
  await assert.rejects(
    sendTutorMessage(u.id, { ...body, message: "Другая просьба" }, deps),
    /идентификатор|Идентификатор/,
  );
});

test("Tutor exercise context excludes answers, hidden hints, correctness, and cross-user items", async () => {
  const u = await user(),
    other = await user(),
    exercise = await item(u.id);
  const input = { practiceItemId: exercise.id };
  let context = await resolveTutorContext(u.id, input);
  assert.equal(context.display.restricted, true);
  assert.deepEqual(context.safe.exercise?.usedHints, []);
  assert.equal(context.safe.exercise?.solution, undefined);
  assert.ok(!("answer" in context.safe.exercise!));
  assert.ok(!("correct" in context.safe.exercise!));
  await assert.rejects(resolveTutorContext(other.id, input), /не найдено/);
  await assert.rejects(
    resolveTutorContext(u.id, { ...input, topicId: "recursion" }),
    /не соответствует/,
  );
  await revealHint(u.id, exercise.id);
  context = await resolveTutorContext(u.id, input);
  assert.deepEqual(
    context.safe.exercise?.usedHints,
    exercise.question.hints.slice(0, 1),
  );
  const { deps, calls } = fake();
  const result = await sendTutorMessage(
    u.id,
    message("Раскрой ответ", input),
    deps,
  );
  assert.equal(calls[0].exercise?.solution, undefined);
  assert.deepEqual(calls[0].sources, []);
  assert.equal(result.messages[1].sources.length, 0);
  assert.match(result.messages[1].content, /Что дано/);
  await submitPractice(
    u.id,
    exercise.id,
    randomUUID(),
    exercise.question.answer!,
  );
  context = await resolveTutorContext(u.id, input);
  assert.equal(context.display.restricted, false);
  assert.equal(context.safe.exercise?.solution, exercise.question.solution);
});

test("Unfinished protected sessions block all Tutor contexts and existing history", async () => {
  for (const config of [
    { mode: "exam", config: {} },
    { mode: "custom", config: { feedbackMode: "end" } },
    { mode: "custom", config: { hintsAllowed: false } },
  ]) {
    const u = await user(),
      { deps, calls } = fake();
    await sendTutorMessage(u.id, message(), deps);
    const session = await db.practiceSession.create({
      data: { userId: u.id, ...config },
    });
    const blocked = await getTutorSnapshot(
      u.id,
      { topicId: "projection" },
      deps,
    );
    assert.equal(blocked.available, false);
    assert.deepEqual(blocked.messages, []);
    assert.equal(
      (await sendTutorMessage(u.id, message(), deps)).available,
      false,
    );
    assert.equal(calls.length, 1);
    await db.practiceSession.update({
      where: { id: session.id },
      data: { finishedAt: new Date() },
    });
    assert.equal(
      (await getTutorSnapshot(u.id, { topicId: "projection" }, deps)).messages
        .length,
      2,
    );
  }
});

test("Exam beginning during generation suppresses output before storage and exposure", async () => {
  const u = await user();
  const { deps } = fake(async () => {
    await db.practiceSession.create({ data: { userId: u.id, mode: "exam" } });
    return {
      kind: "teaching",
      message: "MUST_NOT_PERSIST",
      grounding: "course",
      citationIds: [source.id],
    };
  });
  const result = await sendTutorMessage(u.id, message(), deps);
  assert.equal(result.available, false);
  assert.deepEqual(result.messages, []);
  const stored = await db.tutorMessage.findMany({
    where: { conversation: { userId: u.id }, role: "assistant" },
  });
  assert.equal(stored[0].status, "failed");
  assert.ok(!stored[0].content.includes("MUST_NOT_PERSIST"));
});

test("Concurrent turns serialize admission and duplicate pending requests do not generate twice", async () => {
  const u = await user();
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const { deps, calls } = fake(async () => {
    entered();
    await gate;
    return {
      kind: "teaching",
      message: "Готово. Что дальше?",
      grounding: "course",
      citationIds: [source.id],
    };
  });
  const body = message();
  const pending = sendTutorMessage(u.id, body, deps);
  await started;
  try {
    const duplicate = await sendTutorMessage(u.id, body, deps);
    assert.equal(duplicate.messages[1].status, "pending");
    await assert.rejects(sendTutorMessage(u.id, message(), deps), /Дождись/);
    await assert.rejects(
      resetTutorConversation(u.id, body.context, deps),
      /Дождись/,
    );
    assert.equal(calls.length, 1);
  } finally {
    release();
  }
  assert.equal((await pending).messages[1].status, "complete");
});

test("Failures are persisted and charged, hourly and daily quotas reject new calls", async () => {
  const u = await user();
  const { deps, calls } = fake(async () => {
    throw new Error("SECRET_PROVIDER_ERROR");
  });
  const body = message();
  const result = await sendTutorMessage(u.id, body, deps);
  assert.equal(result.messages[1].status, "failed");
  assert.ok(!result.messages[1].content.includes("SECRET"));
  await sendTutorMessage(u.id, body, deps);
  assert.equal(calls.length, 1);
  await db.tutorUsage.update({ where: { userId: u.id }, data: { count: 30 } });
  await assert.rejects(sendTutorMessage(u.id, message(), deps), /Лимит/);
  await db.tutorUsage.update({
    where: { userId: u.id },
    data: { count: 0, dayCount: 150 },
  });
  await assert.rejects(sendTutorMessage(u.id, message(), deps), /Лимит/);
});

test("Expired pending turns recover, while empty material and missing configuration do not generate", async () => {
  const u = await user(),
    { deps, calls } = fake();
  const body = message();
  const result = await sendTutorMessage(u.id, body, deps);
  await db.tutorConversation.update({
    where: { id: result.conversationId! },
    data: { busyUntil: new Date(0), busyToken: "expired" },
  });
  await db.tutorMessage.updateMany({
    where: { conversationId: result.conversationId!, role: "assistant" },
    data: { status: "pending", content: "" },
  });
  const expiredSnapshot = await getTutorSnapshot(u.id, body.context, deps);
  assert.equal(expiredSnapshot.messages[1].status, "failed");
  assert.match(expiredSnapshot.messages[1].content, /прерван/);
  const retry = await sendTutorMessage(u.id, body, deps);
  assert.equal(retry.messages[1].status, "failed");
  assert.equal(calls.length, 1);
  await sendTutorMessage(u.id, message(), {
    ...deps,
    retrieve: async () => [],
  });
  assert.equal(calls.length, 1);
  const other = await user();
  assert.equal(
    (await sendTutorMessage(other.id, message(), { provider: null })).available,
    false,
  );
  assert.equal(
    await db.tutorConversation.count({ where: { userId: other.id } }),
    0,
  );
});

test("History stays bounded; full conversations reset without resetting persistent quotas", async () => {
  const u = await user(),
    { deps, calls } = fake();
  const first = await sendTutorMessage(u.id, message(), deps);
  await db.tutorMessage.createMany({
    data: Array.from({ length: 116 }, (_, index) => ({
      conversationId: first.conversationId!,
      requestKey: randomUUID(),
      role: index % 2 ? "assistant" : "user",
      status: "complete",
      content: "x".repeat(1500),
      createdAt: new Date(Date.now() + index),
    })),
  });
  await sendTutorMessage(u.id, message(), deps);
  assert.ok(calls.at(-1)!.history.length <= 12);
  assert.ok(
    calls
      .at(-1)!
      .history.reduce(
        (sum, value) => sum + Buffer.byteLength(value.content),
        0,
      ) <= 9000,
  );
  await assert.rejects(
    sendTutorMessage(u.id, message(), deps),
    /достиг лимита/,
  );
  assert.deepEqual(
    (await resetTutorConversation(u.id, { topicId: "projection" }, deps))
      .messages,
    [],
  );
  assert.equal(
    (await db.tutorUsage.findUniqueOrThrow({ where: { userId: u.id } })).count,
    2,
  );
});

test("A stale provider completion cannot overwrite a later leased turn", async () => {
  const u = await user();
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const slow = fake(async () => {
    entered();
    await gate;
    return {
      kind: "teaching",
      message: "STALE_RESPONSE",
      grounding: "course",
      citationIds: [source.id],
    };
  });
  const oldBody = message();
  const pending = sendTutorMessage(u.id, oldBody, slow.deps);
  await started;
  try {
    await db.tutorConversation.updateMany({
      where: { userId: u.id },
      data: { busyUntil: new Date(0) },
    });
    const current = fake();
    const next = await sendTutorMessage(u.id, message(), current.deps);
    assert.equal(next.messages.length, 4);
    assert.equal(next.messages[1].status, "failed");
    assert.equal(next.messages[3].status, "complete");
    release();
    const late = await pending;
    assert.deepEqual(late, next);
    assert.ok(!JSON.stringify(late).includes("STALE_RESPONSE"));
    assert.equal(
      (await db.tutorUsage.findUniqueOrThrow({ where: { userId: u.id } }))
        .count,
      2,
    );
  } finally {
    release();
    await pending;
  }
});

test("Simultaneous duplicate admission creates one turn, and quotas span contexts", async () => {
  const u = await user(),
    { deps, calls } = fake(),
    body = message();
  await Promise.all(
    Array.from({ length: 4 }, () => sendTutorMessage(u.id, body, deps)),
  );
  assert.equal(calls.length, 1);
  assert.equal(
    (await getTutorSnapshot(u.id, body.context, deps)).messages.length,
    2,
  );
  await db.tutorUsage.update({ where: { userId: u.id }, data: { count: 29 } });
  const results = await Promise.allSettled([
    sendTutorMessage(u.id, message(), deps),
    sendTutorMessage(
      u.id,
      { ...message(), context: { topicId: "projection", sectionIndex: 0 } },
      deps,
    ),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.filter((result) => result.status === "rejected").length,
    1,
  );
  assert.equal(
    (await db.tutorUsage.findUniqueOrThrow({ where: { userId: u.id } })).count,
    30,
  );
  assert.equal(calls.length, 2);
});

test("Invalid contexts do not create turns and coaching does not mutate practice or progress", async () => {
  const u = await user(),
    { deps } = fake();
  await assert.rejects(getTutorSnapshot(u.id, {}, deps));
  await assert.rejects(
    getTutorSnapshot(u.id, { topicId: "projection", sectionIndex: 200 }, deps),
    /не найден/,
  );
  await assert.rejects(
    sendTutorMessage(u.id, { ...message(), message: "x".repeat(2001) }, deps),
  );
  assert.equal(
    await db.tutorConversation.count({ where: { userId: u.id } }),
    0,
  );
  const exercise = await item(u.id);
  const before = await db.practiceItem.findUniqueOrThrow({
    where: { id: exercise.id },
  });
  const progress = await db.topicProgress.findMany({ where: { userId: u.id } });
  await sendTutorMessage(
    u.id,
    message("Проверь решение", { practiceItemId: exercise.id }),
    deps,
  );
  assert.deepEqual(
    await db.practiceItem.findUniqueOrThrow({ where: { id: exercise.id } }),
    before,
  );
  assert.deepEqual(
    await db.topicProgress.findMany({ where: { userId: u.id } }),
    progress,
  );
  assert.equal(
    await db.practiceAttempt.count({ where: { itemId: exercise.id } }),
    0,
  );
});
