import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { loadContent } from "../src/lib/content-source";
import {
  startPractice,
  submitPractice,
  revealHint,
  repeatPractice,
  customSelection,
} from "../src/lib/practice-service";
import { automaticTopicIds } from "../src/lib/curriculum";
import { getLeaderboard, getProgress } from "../src/lib/progress";
const created: string[] = [];
const createdTopics: string[] = [];
async function user() {
  const u = await db.user.create({
    data: {
      telegramId: `test-${randomUUID()}`,
      firstName: "Integration",
      username: `hidden-${randomUUID()}`,
      photoUrl: "https://example.test/private.png",
      settings: { create: {} },
    },
  });
  created.push(u.id);
  return u;
}
async function item(userId: string, mode = "topic") {
  const id = await startPractice(userId, mode, "projection");
  return await db.practiceItem.findFirstOrThrow({
    where: { sessionId: id },
    orderBy: { position: "asc" },
  });
}
after(async () => {
  await db.user.deleteMany({ where: { id: { in: created } } });
  await db.question.deleteMany({where:{topicId:{in:createdTopics}}});
  await db.topic.deleteMany({ where: { id: { in: createdTopics } } });
  await db.$disconnect();
});
test("semantic filters persist with multi-topic difficulty filters and survive repeat", async () => {
  const u = await user();
  const key = randomUUID();
  const options = {
    topicIds: ["pointer-arithmetic", "recursion"],
    difficulties: ["HARD", "CHALLENGE"] as ("HARD" | "CHALLENGE")[],
    questionTypes: ["NUMERIC", "OUTPUT", "MULTIPLE_CHOICE"],
    patternIds: ["memory-tracing"], count: 5,
  };
  const starts = await Promise.all([1,2,3].map(() => startPractice(u.id,"custom",undefined,"programming",key,options)));
  assert.equal(new Set(starts).size,1);
  const session = await db.practiceSession.findUniqueOrThrow({ where:{id:starts[0]}, include:{items:{include:{question:true},orderBy:{position:"asc"}}} });
  assert.equal(session.items.length,5);
  assert.equal(new Set(session.items.map((item)=>item.questionId)).size,5);
  for(const item of session.items) {
    assert.ok(options.topicIds.includes(item.question.topicId));
    assert.ok(options.questionTypes.includes(item.question.type));
    assert.ok(["HARD","CHALLENGE"].includes(item.question.difficulty));
    assert.ok(item.question.tags.includes("memory-tracing"));
    await submitPractice(u.id,item.id,randomUUID(),item.question.answer!);
  }
  const repeated = await repeatPractice(u.id,session.id,randomUUID());
  const next = await db.practiceSession.findUniqueOrThrow({where:{id:repeated}});
  assert.deepEqual((next.config as {patternIds:string[]}).patternIds,["memory-tracing"]);
  await assert.rejects(startPractice(u.id,"custom",undefined,"programming",randomUUID(),{...options,patternIds:["unknown-pattern"]}),/Неизвестная категория/);
});
test("automatic practice respects curriculum while explicit supplementary practice stays available", async () => {
  const u = await user();
  for(const mode of ["daily","quick","exam"]) {
    const id = await startPractice(u.id,mode,undefined,undefined,randomUUID());
    const items=await db.practiceItem.findMany({where:{sessionId:id},include:{question:true}});
    assert.ok(items.length>0);
    assert.ok(items.every((item)=>automaticTopicIds.includes(item.question.topicId)));
  }
  const manual=await startPractice(u.id,"topic","malloc",undefined,randomUUID());
  const manualItems = await db.practiceItem.findMany({where:{sessionId:manual},include:{question:true}});
  assert.equal(manualItems.length,10);
  assert.ok(manualItems.every(item=>item.question.topicId==="malloc"));
});
test("custom selection exhausts unseen questions before solved ones across levels", () => {
  const questions = [
    {id:"new-medium",topicId:"a",difficulty:"MEDIUM",type:"NUMERIC",selectionPriority:0},
    {id:"new-medium-2",topicId:"b",difficulty:"MEDIUM",type:"NUMERIC",selectionPriority:0},
    {id:"old-hard",topicId:"c",difficulty:"HARD",type:"NUMERIC",selectionPriority:3},
  ];
  assert.deepEqual(customSelection(questions,{topicIds:[],difficulties:["HARD","MEDIUM"],count:2}).map((q)=>q.id),["new-medium","new-medium-2"]);
});
test("concurrent duplicate submissions award XP and persist the attempt exactly once", async () => {
  const u = await user(),
    i = await item(u.id),
    key = randomUUID();
  const results = await Promise.all([
    submitPractice(u.id, i.id, key, "6"),
    submitPractice(u.id, i.id, key, "6"),
  ]);
  assert.ok(results.every((r) => r.correct));
  assert.equal(await db.practiceAttempt.count({ where: { itemId: i.id } }), 1);
  const saved = await db.practiceItem.findUniqueOrThrow({
    where: { id: i.id },
  });
  assert.equal(saved.xp, 10);
  assert.equal(saved.attempts, 1);
});
test("different sessions cannot farm XP on the same question concurrently", async () => {
  const u = await user(),
    a = await item(u.id),
    b = await item(u.id);
  await Promise.all([
    submitPractice(u.id, a.id, randomUUID(), "6"),
    submitPractice(u.id, b.id, randomUUID(), "6"),
  ]);
  const items = await db.practiceItem.findMany({
    where: { id: { in: [a.id, b.id] } },
  });
  assert.equal(
    items.reduce((s, i) => s + i.xp, 0),
    10,
  );
});
test("hints survive reloads, affect reward, and stop at full solution", async () => {
  const u = await user(),
    i = await item(u.id);
  for (let n = 1; n <= 4; n++) {
    const result = await revealHint(u.id, i.id);
    assert.equal(result.level, n);
    assert.ok(result.text);
  }
  assert.equal((await revealHint(u.id, i.id)).level, 4);
  const result = await submitPractice(u.id, i.id, randomUUID(), "6");
  assert.equal(result.xp, 4);
  assert.equal(
    (await db.practiceItem.findUniqueOrThrow({ where: { id: i.id } }))
      .hintLevel,
    4,
  );
});
test("authorization prevents another user from answering or opening hints", async () => {
  const a = await user(),
    b = await user(),
    i = await item(a.id);
  await assert.rejects(
    submitPractice(b.id, i.id, randomUUID(), "6"),
    /не найдено/,
  );
  await assert.rejects(revealHint(b.id, i.id), /недоступна/);
});
test("third incorrect answer closes the item; retries cannot award XP", async () => {
  const u = await user(),
    i = await item(u.id);
  for (let n = 1; n <= 3; n++) {
    const r = await submitPractice(u.id, i.id, randomUUID(), "999");
    assert.equal(r.finished, n === 3);
  }
  const late = await submitPractice(u.id, i.id, randomUUID(), "6");
  assert.equal(late.correct, false);
  assert.equal(late.xp, 0);
  assert.equal(late.attempts, 3);
});
test("daily creation is idempotent under concurrency; exam forbids hints", async () => {
  const u = await user();
  const ids = await Promise.all([
    startPractice(u.id, "daily"),
    startPractice(u.id, "daily"),
  ]);
  assert.equal(ids[0], ids[1]);
  const i = await item(u.id, "exam");
  await assert.rejects(revealHint(u.id, i.id), /экзамена/);
});
test("a retried start creates one session and preserves selected questions", async () => {
  const u = await user(),
    key = randomUUID();
  const starts = await Promise.all(
    Array.from({ length: 3 }, () =>
      startPractice(u.id, "topic", "projection", undefined, key),
    ),
  );
  assert.equal(new Set(starts).size, 1);
  assert.equal(await db.practiceSession.count({ where: { userId: u.id } }), 1);
  const questions = await db.practiceItem.findMany({
    where: { sessionId: starts[0] },
    orderBy: { position: "asc" },
  });
  assert.ok(questions.length > 0);
  assert.equal(
    await startPractice(u.id, "topic", "projection", undefined, key),
    starts[0],
  );
  const another = await startPractice(
    u.id,
    "topic",
    "projection",
    undefined,
    randomUUID(),
  );
  assert.notEqual(another, starts[0]);
  const otherUser = await user();
  assert.notEqual(
    await startPractice(otherUser.id, "topic", "projection", undefined, key),
    starts[0],
  );
});
test("custom session filters subjects, topics and difficulty, persists selection, and retries idempotently", async () => {
  const u = await user();
  const key = randomUUID();
  const options = {
    topicIds: ["projection", "determinants"],
    difficulties: ["HARD" as const, "CHALLENGE" as const],
    count: 3,
  };
  const ids = await Promise.all([
    startPractice(u.id, "custom", undefined, "geometry", key, options),
    startPractice(u.id, "custom", undefined, "geometry", key, options),
  ]);
  assert.equal(ids[0], ids[1]);
  const items = await db.practiceItem.findMany({
    where: { sessionId: ids[0] },
    include: { question: true },
    orderBy: { position: "asc" },
  });
  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((item) => item.question.difficulty),
    ["HARD", "CHALLENGE", "HARD"],
  );
  assert.deepEqual(
    new Set(items.map((item) => item.question.topicId)),
    new Set(options.topicIds),
  );
  assert.ok(
    items.every((item) =>
      options.difficulties.includes(
        item.question.difficulty as "HARD" | "CHALLENGE",
      ),
    ),
  );
  assert.equal(await db.practiceSession.count({ where: { userId: u.id } }), 1);
  await assert.rejects(
    startPractice(
      u.id,
      "custom",
      undefined,
      "architecture",
      randomUUID(),
      options,
    ),
    /не относятся к предмету/,
  );
  assert.equal(await db.practiceSession.count({ where: { userId: u.id } }), 1);
});
test("custom practice does not create a session when the selected difficulty has no questions", async () => {
  const u = await user();
  // An isolated EASY-only bank protects the absent-difficulty case as content grows.
  const source = await db.topic.findUniqueOrThrow({where:{id:"real-axioms"}});
  const topicId = `test-empty-${randomUUID()}`;
  await db.topic.create({data:{
    id:topicId,title:"Empty integration fixture",english:"Empty",moduleId:source.moduleId,
    order:999,difficulty:"EASY",estimatedMinutes:1,prerequisites:[],keywords:[],content:{},
  }});
  createdTopics.push(topicId);
  const {questions} = await loadContent();
  const question = questions.find(q=>q.topicId==="real-axioms" && q.difficulty==="EASY");
  assert.ok(question);
  await db.question.create({data:{...question,id:topicId+"-easy",topicId,feedback:question.feedback??{}}});
  await assert.rejects(
    startPractice(u.id, "custom", undefined, "analysis", randomUUID(), {
      topicIds: [topicId],
      difficulties: ["CHALLENGE"],
      count: 5,
    }),
    /нет заданий/,
  );
  assert.equal(await db.practiceSession.count({ where: { userId: u.id } }), 0);
});
test("custom type filtering, delayed feedback, disabled hints and repeat preserve settings", async () => {
  const u = await user();
  const id = await startPractice(
    u.id,
    "custom",
    undefined,
    "geometry",
    randomUUID(),
    {
      topicIds: ["projection"],
      difficulties: ["HARD"],
      questionTypes: ["STEPS"],
      count: 1,
      hintsAllowed: false,
      feedbackMode: "end",
    },
  );
  const session = await db.practiceSession.findUniqueOrThrow({
    where: { id },
    include: { items: { include: { question: true } } },
  });
  assert.equal(session.items.length, 1);
  assert.equal(session.items[0].question.type, "STEPS");
  assert.equal(
    (session.config as { feedbackMode: string }).feedbackMode,
    "end",
  );
  await assert.rejects(
    revealHint(u.id, session.items[0].id),
    /Подсказки отключены/,
  );
  const result = await submitPractice(u.id, session.items[0].id, randomUUID(), [
    "6",
    "2",
    "3",
  ]);
  assert.equal(result.correct, null);
  assert.equal(result.solution, null);
  assert.equal(result.finished, true);
  const after = await getProgress(u.id);
  assert.deepEqual(
    after.topics.find((t) => t.id === "projection")?.difficultyPerformance.HARD,
    { correct: 1, total: 1 },
  );
  const repeated = await repeatPractice(u.id, id, randomUUID());
  assert.notEqual(repeated, id);
  const copy = await db.practiceSession.findUniqueOrThrow({
    where: { id: repeated },
    include: { items: {include:{question:true}} },
  });
  assert.deepEqual(
    copy.config,
    session.config === null
      ? null
      : {
          ...(session.config as object),
          overallBefore: (copy.config as { overallBefore: number | null })
            .overallBefore,
        },
  );
  // A larger bank must prefer an unseen question when repeating the same settings.
  assert.notEqual(copy.items[0].questionId, session.items[0].questionId);
  assert.equal(copy.items[0].question.topicId,"projection");
  assert.equal(copy.items[0].question.type,"STEPS");
  assert.equal(copy.items[0].question.difficulty,"HARD");
  const repeatedAnswer = await submitPractice(
    u.id,
    copy.items[0].id,
    randomUUID(),
    copy.items[0].question.answer!,
  );
  assert.equal(repeatedAnswer.xp, null);
  assert.equal(
    (
      await db.practiceItem.findUniqueOrThrow({
        where: { id: copy.items[0].id },
      })
    ).xp,
    30,
  );
});
test("custom selection prefers unseen questions over recently attempted ones", async () => {
  const u = await user();
  const options = {
    topicIds: [] as string[],
    difficulties: ["EASY" as const],
    count: 1,
  };
  const firstId = await startPractice(
    u.id,
    "custom",
    undefined,
    "geometry",
    randomUUID(),
    options,
  );
  const first = await db.practiceItem.findFirstOrThrow({
    where: { sessionId: firstId },
  });
  for (let attempt = 0; attempt < 3; attempt++)
    await submitPractice(u.id, first.id, randomUUID(), "not-an-answer");
  const secondId = await startPractice(
    u.id,
    "custom",
    undefined,
    "geometry",
    randomUUID(),
    options,
  );
  const second = await db.practiceItem.findFirstOrThrow({
    where: { sessionId: secondId },
  });
  assert.notEqual(first.questionId, second.questionId);
});
test("custom practice rejects unavailable count without creating a partial session", async () => {
  const u = await user();
  await assert.rejects(
    startPractice(u.id, "custom", undefined, "geometry", randomUUID(), {
      topicIds: ["projection"],
      difficulties: ["CHALLENGE"],
      questionTypes: ["NUMERIC"],
      count: 2,
    }),
    /Доступно только 1/,
  );
  assert.equal(await db.practiceSession.count({ where: { userId: u.id } }), 0);
});
test("empty topic and weak selections do not create empty sessions", async () => {
  const u = await user();
  await assert.rejects(
    startPractice(u.id, "topic", "test-no-questions", undefined, randomUUID()),
    /нет заданий/,
  );
  await assert.rejects(
    startPractice(u.id, "weak", undefined, undefined, randomUUID()),
    /нет слабых тем/,
  );
  assert.equal(await db.practiceSession.count({ where: { userId: u.id } }), 0);
});
test("database enforces nonnegative XP", async () => {
  const u = await user(),
    i = await item(u.id);
  await assert.rejects(
    db.practiceItem.update({ where: { id: i.id }, data: { xp: -1 } }),
  );
});
test("leaderboard respects consent, redacts aliases/photos, and filters period activity", async () => {
  const u = await user();
  const questions = await db.question.findMany({
    take: 30,
    orderBy: { id: "asc" },
  });
  const s = await db.practiceSession.create({
    data: {
      userId: u.id,
      mode: "test",
      items: {
        create: questions.map((q, position) => ({
          questionId: q.id,
          position,
          completedAt: new Date("2020-01-01"),
          correct: true,
          attempts: 1,
          xp: 10,
        })),
      },
    },
  });
  assert.ok(s.id);
  assert.equal(
    (await getLeaderboard("all")).some((r) => r.id === u.id),
    false,
  );
  await db.userSettings.update({
    where: { userId: u.id },
    data: { leaderboard: true },
  });
  const row = (await getLeaderboard("all")).find((r) => r.id === u.id)!;
  assert.ok(row);
  assert.equal(row.username, null);
  assert.equal(row.photoUrl, null);
  assert.equal(JSON.stringify(row).includes(u.username!), false);
  assert.equal(
    (await getLeaderboard("week")).some((r) => r.id === u.id),
    false,
  );
  await db.userSettings.update({
    where: { userId: u.id },
    data: { showUsername: true, showPhoto: true },
  });
  const visible = (await getLeaderboard("all")).find((r) => r.id === u.id)!;
  assert.equal(visible.username, u.username);
  assert.equal(visible.photoUrl, u.photoUrl);
});
test("reading without scored practice does not create GPA or weak-topic status", async () => {
  const u = await user();
  await db.topicProgress.create({
    data: { userId: u.id, topicId: "projection", readAt: new Date() },
  });
  const p = await getProgress(u.id);
  assert.equal(p.gpa, null);
  assert.equal(p.overall, null);
  assert.equal(p.weak.length, 0);
  const topic = p.topics.find((t) => t.id === "projection")!;
  assert.equal(topic.assessed, false);
  assert.equal(topic.started, true);
});
test("incorrect feedback explains a specific error and keeps full solution hidden", async () => {
  const u = await user(),
    i = await item(u.id);
  const result = await submitPractice(u.id, i.id, randomUUID(), "3");
  assert.equal(result.correct, false);
  assert.equal(result.finished, false);
  assert.equal(result.solution, null);
  assert.match(result.feedback ?? "", /коэффициент 3/);
});
test("exam hides feedback and assessment until all mixed questions are answered", async () => {
  const u = await user(),
    id = await startPractice(u.id, "exam");
  const items = await db.practiceItem.findMany({
    where: { sessionId: id },
    include: {
      question: { include: { topic: { include: { module: true } } } },
    },
    orderBy: { position: "asc" },
  });
  assert.equal(items.length, 15);
  assert.equal(
    new Set(items.map((i) => i.question.topic.module.subjectId)).size,
    5,
  );
  const first = await submitPractice(u.id, items[0].id, randomUUID(), "wrong");
  assert.equal(first.correct, null);
  assert.equal(first.xp, null);
  assert.equal(first.solution, null);
  assert.equal(first.feedback, null);
  assert.equal((await getProgress(u.id)).gpa, null);
  for (const item of items.slice(1))
    await submitPractice(
      u.id,
      item.id,
      randomUUID(),
      item.question.answer as string,
    );
  assert.ok(
    (await db.practiceSession.findUniqueOrThrow({ where: { id } })).finishedAt,
  );
  assert.ok((await getProgress(u.id)).assessedCount > 0);
});
