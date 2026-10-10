import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { indexCourseContent } from "../src/lib/tutor/indexer";
import { retrieveCourseContext } from "../src/lib/tutor/retrieval";
import type { TutorProvider } from "../src/lib/tutor/types";

const subjects: string[] = [];
async function fixture() {
  const id = `tutor-rag-${randomUUID()}`;
  const subject = await db.subject.create({
    data: {
      id,
      title: "RAG test",
      english: "RAG test",
      description: "test",
      icon: "test",
      color: "test",
      order: 1000,
    },
  });
  subjects.push(subject.id);
  const courseModule = await db.module.create({
    data: { id: `${id}-module`, title: "Module", order: 0, subjectId: id },
  });
  const make = (suffix: string) =>
    db.topic.create({
      data: {
        id: `${id}-${suffix}`,
        title: `Topic ${suffix}`,
        english: suffix,
        moduleId: courseModule.id,
        order: 0,
        difficulty: "easy",
        estimatedMinutes: 1,
        prerequisites: [],
        keywords: [],
        content: {
          sections: [
            { title: "Multiplexer", text: `NOT S selects an input. ${suffix}` },
          ],
          quizAnswer: "PRIVATE_QUIZ_ANSWER",
        },
      },
    });
  return { a: await make("a"), b: await make("b") };
}
let embeddingCalls = 0;
const provider: TutorProvider = {
  embeddingModel: "test:semantic-v1",
  embedText: async (texts) => {
    embeddingCalls++;
    return texts.map(() => [1, 0]);
  },
  generateTutorResponse: async () => {
    throw new Error("retrieval must not generate answers");
  },
};
after(async () => {
  await db.topic.deleteMany({
    where: { module: { subjectId: { in: subjects } } },
  });
  await db.module.deleteMany({ where: { subjectId: { in: subjects } } });
  await db.subject.deleteMany({ where: { id: { in: subjects } } });
  await db.$disconnect();
});

test("course index persists embeddings idempotently and retrieval prioritizes topic without crossing subjects", async () => {
  const local = await fixture(),
    foreign = await fixture();
  embeddingCalls = 0;
  for (const topic of [local.a, local.b, foreign.a])
    await indexCourseContent({ topicId: topic.id, provider });
  assert.equal(embeddingCalls, 3);
  assert.equal(
    (await indexCourseContent({ topicId: local.a.id, provider }))
      .embeddingsCreated,
    0,
  );
  assert.equal(embeddingCalls, 3);
  await indexCourseContent({ topicId: local.a.id });
  const rows = await db.lectureChunk.findMany({
    where: { topicId: local.a.id },
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].embedding, [1, 0]);
  assert.ok(!rows[0].text.includes("PRIVATE_QUIZ_ANSWER"));
  const result = await retrieveCourseContext(
    { topicId: local.a.id, sectionIndex: 0, query: "NOT S" },
    provider,
  );
  assert.equal(result[0].topicId, local.a.id);
  assert.equal(result[0].retrieval, "semantic");
  assert.ok(result.some((c) => c.topicId === local.b.id));
  assert.ok(result.every((c) => c.topicId !== foreign.a.id));
  assert.equal(result[0].url, `/topics/${local.a.id}#section-0`);
});

test("stale lesson text cannot be retrieved; changed content clears vectors until explicit re-embedding", async () => {
  const { a } = await fixture();
  await indexCourseContent({ topicId: a.id, provider });
  await db.topic.update({
    where: { id: a.id },
    data: {
      content: {
        sections: [{ title: "Updated", text: "A changed course explanation." }],
      },
    },
  });
  assert.deepEqual(
    await retrieveCourseContext({ topicId: a.id, query: "NOT S" }, provider),
    [],
  );
  await indexCourseContent({ topicId: a.id });
  const row = await db.lectureChunk.findFirstOrThrow({
    where: { topicId: a.id },
  });
  assert.deepEqual(row.embedding, []);
  assert.equal(row.embeddingModel, "");
  const lexical = await retrieveCourseContext(
    { topicId: a.id, query: "why" },
    provider,
  );
  assert.equal(lexical[0].retrieval, "lexical");
  assert.equal(lexical[0].sectionTitle, "Updated");
  assert.equal(
    (await indexCourseContent({ topicId: a.id, provider })).embeddingsCreated,
    1,
  );
  await db.topic.update({
    where: { id: a.id },
    data: { content: { sections: [] } },
  });
  await indexCourseContent({ topicId: a.id });
  assert.equal(await db.lectureChunk.count({ where: { topicId: a.id } }), 0);
});

test("embedding outage and model mismatch use honest lexical fallback; absent index is empty", async () => {
  const { a, b } = await fixture();
  await indexCourseContent({ topicId: a.id, provider });
  const outage = {
    ...provider,
    embedText: async () => {
      throw new Error("unavailable");
    },
  };
  const result = await retrieveCourseContext(
    { topicId: a.id, query: "NOT" },
    outage,
  );
  assert.equal(result[0].retrieval, "lexical");
  const mismatch = { ...outage, embeddingModel: "test:another" };
  assert.equal(
    (await retrieveCourseContext({ topicId: a.id, query: "NOT" }, mismatch))[0]
      .retrieval,
    "lexical",
  );
  assert.deepEqual(
    await retrieveCourseContext(
      { topicId: `missing-${b.id}`, query: "NOT" },
      provider,
    ),
    [],
  );
  await assert.rejects(
    indexCourseContent({
      topicId: a.id,
      provider: { ...outage, embeddingModel: "new-model" },
    }),
    /unavailable/,
  );
  assert.equal(
    (await db.lectureChunk.findFirstOrThrow({ where: { topicId: a.id } }))
      .embeddingModel,
    provider.embeddingModel,
  );
});
