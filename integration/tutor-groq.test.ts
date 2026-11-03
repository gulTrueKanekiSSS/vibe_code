import { test, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { db } from "../src/lib/db";
import { reserveGroqRequest } from "../src/lib/tutor/groq-budget";
import { createGroqTutorProvider } from "../src/lib/tutor/groq-provider";
import { TutorProviderError } from "../src/lib/tutor/provider-common";
import { sendTutorMessage, getTutorSnapshot } from "../src/lib/tutor-service";
import { retrieveCourseContext } from "../src/lib/tutor/retrieval";
import { indexCourseContent } from "../src/lib/tutor/indexer";
import { startPractice, finishPractice } from "../src/lib/practice-service";
import type { TutorGenerationInput } from "../src/lib/tutor/types";

// Never mutate the provider-wide row in a shared/remote/default database.
let dedicatedDatabase = false;
try {
  const target = new URL(process.env.DATABASE_URL!);
  dedicatedDatabase =
    ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) &&
    target.pathname === "/studyspace_groq_test";
} catch {
  /* No configured isolated database: skip without registering DB work. */
}

describe("Groq isolated database", { skip: !dedicatedDatabase }, () => {
  const users: string[] = [];
  const subjects: string[] = [];
  const config = {
    apiKey: "TEST_GROQ_KEY",
    model: "openai/gpt-oss-120b",
    budget: { perMinute: 30, perDay: 10 },
  };
  async function learner() {
    const user = await db.user.create({
      data: {
        telegramId: `groq-test-${randomUUID()}`,
        firstName: "PRIVATE_PROFILE",
      },
    });
    users.push(user.id);
    return user;
  }
  async function fixture() {
    const id = `groq-rag-${randomUUID()}`;
    await db.subject.create({
      data: {
        id,
        title: "Test",
        english: "Test",
        description: "Test",
        icon: "test",
        color: "test",
        order: 999,
      },
    });
    subjects.push(id);
    await db.module.create({
      data: { id: `${id}-module`, title: "Test", order: 0, subjectId: id },
    });
    const topic = await db.topic.create({
      data: {
        id: `${id}-topic`,
        title: "Проекция",
        english: "Projection",
        moduleId: `${id}-module`,
        order: 0,
        difficulty: "MEDIUM",
        estimatedMinutes: 1,
        prerequisites: [],
        keywords: [],
        content: {
          sections: [
            {
              title: "Интуиция",
              text: "Проекция — компонента вектора вдоль направления.",
            },
          ],
          quizAnswer: "PRIVATE_QUIZ",
        },
      },
    });
    await indexCourseContent({ topicId: topic.id });
    return topic;
  }
  beforeEach(async () => {
    await db.tutorProviderUsage.deleteMany({ where: { provider: "groq" } });
  });
  after(async () => {
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.question.deleteMany({
      where: { topic: { module: { subjectId: { in: subjects } } } },
    });
    await db.topic.deleteMany({
      where: { module: { subjectId: { in: subjects } } },
    });
    await db.module.deleteMany({ where: { subjectId: { in: subjects } } });
    await db.subject.deleteMany({ where: { id: { in: subjects } } });
    await db.tutorProviderUsage.deleteMany({ where: { provider: "groq" } });
    await db.$disconnect();
  });
  const rateLimited = (e: unknown) =>
    e instanceof TutorProviderError && e.code === "rate_limited";

  test("Groq zero budgets refuse requests without creating a usage row", async () => {
    await assert.rejects(
      reserveGroqRequest({ perMinute: 0, perDay: 10 }),
      rateLimited,
    );
    await assert.rejects(
      reserveGroqRequest({ perMinute: 10, perDay: 0 }),
      rateLimited,
    );
    assert.equal(await db.tutorProviderUsage.count(), 0);
  });

  test("Groq atomic reservation enforces one shared daily cap under races", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        reserveGroqRequest({ perMinute: 30, perDay: 3 }),
      ),
    );
    assert.equal(results.filter((x) => x.status === "fulfilled").length, 3);
    assert.ok(
      results
        .filter((x) => x.status === "rejected")
        .every((x) => rateLimited(x.reason)),
    );
    const usage = await db.tutorProviderUsage.findUniqueOrThrow({
      where: { provider: "groq" },
    });
    assert.equal(usage.dayCount, 3);
    assert.ok(usage.minuteCount <= 3);
  });

  test("Groq minute/day windows reset independently, and changing config does not reset usage", async () => {
    await reserveGroqRequest({ perMinute: 1, perDay: 3 });
    await assert.rejects(
      reserveGroqRequest({ perMinute: 1, perDay: 3 }),
      rateLimited,
    );
    await db.tutorProviderUsage.update({
      where: { provider: "groq" },
      data: { minuteStart: new Date(0) },
    });
    await reserveGroqRequest({ perMinute: 1, perDay: 3 });
    assert.equal(
      (
        await db.tutorProviderUsage.findUniqueOrThrow({
          where: { provider: "groq" },
        })
      ).dayCount,
      2,
    );
    await assert.rejects(
      reserveGroqRequest({ perMinute: 30, perDay: 1 }),
      rateLimited,
    );
    await db.tutorProviderUsage.update({
      where: { provider: "groq" },
      data: { minuteStart: new Date(0), dayStart: new Date(0) },
    });
    await reserveGroqRequest({ perMinute: 1, perDay: 1 });
    const row = await db.tutorProviderUsage.findUniqueOrThrow({
      where: { provider: "groq" },
    });
    assert.equal(row.minuteCount, 1);
    assert.equal(row.dayCount, 1);
  });

  test("Groq stale reservations or a backward clock cannot reset a newer budget window", async () => {
    const future = new Date(Date.now() + 86_400_000);
    await db.tutorProviderUsage.create({
      data: {
        provider: "groq",
        minuteStart: future,
        dayStart: future,
        minuteCount: 1,
        dayCount: 1,
      },
    });
    await assert.rejects(
      reserveGroqRequest({ perMinute: 1, perDay: 1 }),
      rateLimited,
    );
    await reserveGroqRequest({ perMinute: 2, perDay: 2 });
    const row = await db.tutorProviderUsage.findUniqueOrThrow({
      where: { provider: "groq" },
    });
    assert.equal(row.minuteStart.getTime(), future.getTime());
    assert.equal(row.dayStart.getTime(), future.getTime());
    assert.equal(row.minuteCount, 2);
    assert.equal(row.dayCount, 2);
  });

  test("Groq budget is shared by independent server processes", async () => {
    const worker = () =>
      new Promise<number>((resolve, reject) => {
        const code = `const {reserveGroqRequest}=require('./src/lib/tutor/groq-budget');const {db}=require('./src/lib/db');Promise.allSettled(Array.from({length:4},()=>reserveGroqRequest({perMinute:30,perDay:5}))).then(r=>console.log(r.filter(x=>x.status==='fulfilled').length)).finally(()=>db.$disconnect())`;
        const child = spawn(process.execPath, ["--import", "tsx", "-e", code], {
          env: process.env,
          stdio: ["ignore", "pipe", "pipe"],
        });
        let out = "";
        child.stdout.on("data", (chunk) => {
          out += chunk;
        });
        child.stderr.resume();
        child.on("error", reject);
        child.on("close", (code) =>
          code === 0 && /^\d+\s*$/.test(out)
            ? resolve(Number(out))
            : reject(new Error("Local quota worker failed")),
        );
      });
    const counts = await Promise.all([worker(), worker(), worker()]);
    assert.equal(
      counts.reduce((a, b) => a + b, 0),
      5,
    );
    assert.equal(
      (
        await db.tutorProviderUsage.findUniqueOrThrow({
          where: { provider: "groq" },
        })
      ).dayCount,
      5,
    );
  });

  test("Groq uses lexical course chunks without embeddings, with verified citations and owned idempotent history", async () => {
    const topic = await fixture(),
      a = await learner(),
      b = await learner();
    let calls = 0;
    const sent: TutorGenerationInput[] = [];
    const p = createGroqTutorProvider(config, async (_url, init) => {
      calls++;
      const data = JSON.parse(
        JSON.parse(init!.body as string).messages.at(-1).content,
      );
      assert.ok(!String(init!.body).includes("PRIVATE_PROFILE"));
      assert.ok(!String(init!.body).includes("PRIVATE_QUIZ"));
      return Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: JSON.stringify({
                kind: "teaching",
                message:
                  "Projection — компонента вдоль направления. Какое направление выбрано?",
                citationIds: [data.sources[0].id],
                grounding: "course",
              }),
            },
          },
        ],
      });
    });
    // Even a corrupt/matching cached vector must not make Groq request embeddings.
    await db.lectureChunk.updateMany({
      where: { topicId: topic.id },
      data: { embeddingModel: "", embedding: [1, 0] },
    });
    const originalEmbed = p.embedText;
    p.embedText = async () => {
      throw new Error("Embedding API must not be called");
    };
    const chunks = await retrieveCourseContext(
      { topicId: topic.id, query: "проекция направления" },
      p,
    );
    assert.ok(chunks.length);
    assert.ok(chunks.every((c) => c.retrieval === "lexical"));
    p.embedText = originalEmbed;
    assert.equal(
      (await indexCourseContent({ topicId: topic.id })).embeddingsCreated,
      0,
    );
    const originalGenerate = p.generateTutorResponse;
    p.generateTutorResponse = async (input) => {
      sent.push(input);
      return originalGenerate(input);
    };
    const body = {
      context: { topicId: topic.id },
      message: "Объясни проекцию",
      requestKey: randomUUID(),
    };
    const first = await sendTutorMessage(a.id, body, { provider: p });
    assert.equal(first.messages[1].status, "complete");
    assert.equal(first.messages[1].sources[0].topicId, topic.id);
    assert.deepEqual(
      await sendTutorMessage(a.id, body, { provider: p }),
      first,
    );
    assert.equal(calls, 1);
    assert.equal(sent.length, 1);
    assert.equal(
      (
        await db.tutorProviderUsage.findUniqueOrThrow({
          where: { provider: "groq" },
        })
      ).dayCount,
      1,
    );
    assert.equal(
      (await getTutorSnapshot(b.id, body.context, { provider: p })).messages
        .length,
      0,
    );
  });

  test("Groq quota exhaustion and HTTP429 persist friendly failures while retaining ordinary practice", async () => {
    const topic = await fixture(),
      a = await learner(),
      b = await learner();
    let calls = 0;
    const p = createGroqTutorProvider(
      { ...config, budget: { perMinute: 30, perDay: 1 } },
      async () => {
        calls++;
        return new Response("PRIVATE_PROVIDER_SECRET", { status: 429 });
      },
    );
    const body = () => ({
      context: { topicId: topic.id },
      message: "Объясни",
      requestKey: randomUUID(),
    });
    for (const user of [a, b]) {
      const reply = await sendTutorMessage(user.id, body(), { provider: p });
      assert.equal(reply.messages.at(-1)!.status, "failed");
      assert.match(
        reply.messages.at(-1)!.content,
        /Бесплатный лимит.*Уроки, обычные подсказки и практика доступны/,
      );
      assert.ok(!JSON.stringify(reply).includes("PRIVATE_PROVIDER_SECRET"));
    }
    assert.equal(calls, 1);
    const practice = await startPractice(
      a.id,
      "topic",
      "projection",
      undefined,
      randomUUID(),
    );
    assert.ok(practice);
    await finishPractice(a.id, practice);
  });

  test("Groq restricted practice returns only server coaching; unfinished exams block all requests", async () => {
    const a = await learner(),
      b = await learner();
    let calls = 0;
    const p = createGroqTutorProvider(config, async (_url, init) => {
      calls++;
      const body = JSON.parse(init!.body as string);
      const data = JSON.parse(body.messages.at(-1).content);
      assert.equal(data.context.restricted, true);
      assert.deepEqual(data.sources, []);
      assert.ok(!("solution" in data.exercise));
      assert.ok(!("answer" in data.exercise));
      assert.ok(!("correct" in data.exercise));
      return Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: '{"kind":"guided","action":"first-step"}',
            },
          },
        ],
      });
    });
    const sessionId = await startPractice(
      a.id,
      "topic",
      "projection",
      undefined,
      randomUUID(),
    );
    const item = await db.practiceItem.findFirstOrThrow({
      where: { sessionId },
    });
    const body = {
      context: { practiceItemId: item.id },
      message: "Дай ответ",
      requestKey: randomUUID(),
    };
    const reply = await sendTutorMessage(a.id, body, { provider: p });
    assert.match(reply.messages.at(-1)!.content, /Что дано и что нужно найти/);
    await assert.rejects(
      sendTutorMessage(
        b.id,
        { ...body, requestKey: randomUUID() },
        { provider: p },
      ),
      /не найдено/,
    );
    const exam = await startPractice(
      a.id,
      "exam",
      undefined,
      undefined,
      randomUUID(),
    );
    const blocked = await sendTutorMessage(
      a.id,
      {
        context: { topicId: "projection" },
        message: "Объясни",
        requestKey: randomUUID(),
      },
      { provider: p },
    );
    assert.equal(blocked.available, false);
    assert.equal(blocked.messages.length, 0);
    assert.equal(calls, 1);
    await finishPractice(a.id, exam);
    await finishPractice(a.id, sessionId);
  });
});
