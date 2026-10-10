import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chunkLesson,
  cosineSimilarity,
  rankCourseChunks,
  type RankedChunk,
} from "../src/lib/tutor/chunks";
import {
  boundedHistory,
  buildTutorReply,
  INSUFFICIENT_MATERIAL,
  TUTOR_LIMITS,
} from "../src/lib/tutor/policy";
import {
  createOpenAiTutorProvider,
  getTutorProvider,
  TutorProviderError,
} from "../src/lib/tutor/provider";
import type {
  TutorGenerationInput,
  TutorModelResponse,
} from "../src/lib/tutor/types";

const document = {
  id: "mux",
  title: "Multiplexer",
  moduleId: "logic",
  subjectId: "architecture",
  content: {
    sections: [
      { title: "Selection", text: "NOT S selects the input for S = 0." },
    ],
    quizAnswer: "HIDDEN_QUIZ_SENTINEL",
  },
};
const chunk = chunkLesson(document)[0];
const source = {
  ...chunk,
  url: "/topics/mux#section-0",
  retrieval: "semantic" as const,
};
const input: TutorGenerationInput = {
  context: {
    subjectTitle: "Architecture",
    moduleTitle: "Logic",
    topicTitle: "Multiplexer",
    topicId: "mux",
    restricted: false,
  },
  history: [],
  message: "Почему NOT S?",
  sources: [source],
};
const config = {
  apiKey: "test-only-key",
  model: "test-model",
  embeddingModel: "test-embedding",
};
const output = {
  kind: "teaching",
  message: "При S=0 получаем NOT S=1. Чему тогда равно I2 AND S?",
  grounding: "course",
  citationIds: [chunk.id],
} as const;
const teaching = (): TutorModelResponse => ({
  ...output,
  citationIds: [...output.citationIds],
});
const response = (value: unknown) =>
  Response.json({
    status: "completed",
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(value) }],
      },
    ],
  });

test("lesson chunking is deterministic, Unicode/byte bounded, ignores hidden self-check answers and invalid sections", () => {
  assert.deepEqual(chunkLesson(document), [chunk]);
  assert.equal(JSON.stringify(chunk).includes("HIDDEN_QUIZ_SENTINEL"), false);
  assert.deepEqual(chunkLesson({ ...document, content: null }), []);
  assert.deepEqual(
    chunkLesson({
      ...document,
      content: { sections: [null, { title: 1, text: 2 }] },
    }),
    [],
  );
  const text = "😀 перевод NOT S\n".repeat(1000);
  const chunks = chunkLesson({
    ...document,
    content: { sections: [{ title: "Unicode", text }] },
  });
  assert.ok(chunks.length > 1);
  assert.ok(
    chunks.every(
      (c) => Buffer.byteLength(c.text) <= 6400 && !c.text.includes("\uFFFD"),
    ),
  );
  assert.equal(
    chunks
      .map((c) => c.text)
      .join("")
      .replace(/\s/g, ""),
    text.replace(/\s/g, ""),
  );
  assert.equal(new Set(chunks.map((c) => c.id)).size, chunks.length);
  const changed = chunkLesson({ ...document, title: "New title" })[0];
  assert.equal(changed.id, chunk.id);
  assert.notEqual(changed.contentHash, chunk.contentHash);
});

test("retrieval prioritizes section/topic within subject, respects embedding model and source byte limits", () => {
  const local: RankedChunk = {
    ...chunk,
    embedding: [0, 1],
    embeddingModel: "test",
  };
  const related = {
    ...local,
    id: "other",
    topicId: "other",
    embedding: [1, 0],
  };
  const foreign = { ...related, id: "foreign", subjectId: "foreign" };
  const ranked = rankCourseChunks([foreign, related, local], {
    topicId: "mux",
    subjectId: "architecture",
    sectionIndex: 0,
    query: "input",
    embeddingModel: "test",
    queryEmbedding: [1, 0],
  });
  assert.deepEqual(
    ranked.map((c) => c.id),
    [local.id, "other"],
  );
  assert.equal(ranked[0].retrieval, "semantic");
  const lexical = rankCourseChunks([local], {
    topicId: "mux",
    subjectId: "architecture",
    query: "почему",
    embeddingModel: "new",
    queryEmbedding: [1, 0],
  });
  assert.equal(lexical[0].retrieval, "lexical");
  const large = Array.from({ length: 10 }, (_, i) => ({
    ...local,
    id: `${i}`,
    text: "я".repeat(1600),
  }));
  const capped = rankCourseChunks(large, {
    topicId: "mux",
    subjectId: "architecture",
    query: "",
    embeddingModel: "test",
  });
  assert.ok(capped.length <= 4);
  assert.ok(
    capped.reduce((sum, c) => sum + Buffer.byteLength(c.text), 0) <=
      TUTOR_LIMITS.sourceBytes,
  );
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([0, 0], [1, 0]), -1);
  assert.equal(cosineSimilarity([NaN], [1]), -1);
  assert.equal(cosineSimilarity([1], [1, 0]), -1);
});

test("restricted exercises accept only coaching actions, never arbitrary model answers or citations", () => {
  const restricted = {
    ...input,
    context: {
      ...input.context,
      restricted: true,
      practiceItemId: "PRIVATE_ITEM_SENTINEL",
    },
    exercise: {
      prompt: "QUESTION",
      difficulty: "easy",
      attemptCount: 0,
      hintsUsed: [],
    },
  };
  assert.throws(() => buildTutorReply(teaching(), restricted));
  assert.throws(() =>
    buildTutorReply(
      {
        kind: "guided",
        action: "hint",
        message: "SECRET_ANSWER",
      } as unknown as TutorModelResponse,
      restricted,
    ),
  );
  for (const action of [
    "first-step",
    "simpler",
    "hint",
    "why",
    "check",
  ] as const) {
    const reply = buildTutorReply({ kind: "guided", action }, restricted);
    assert.deepEqual(reply.sources, []);
    assert.ok(reply.content.endsWith("?") || reply.content.includes("?"));
    assert.ok(!reply.content.includes("SECRET_ANSWER"));
  }
  const reply = buildTutorReply(
    { kind: "guided", action: "hint" },
    {
      ...restricted,
      exercise: { ...restricted.exercise, hintsUsed: ["Already revealed"] },
    },
  );
  assert.match(reply.content, /Already revealed/);
});

test("only retrieved source IDs yield server-owned citations; general knowledge and insufficient material are explicit", () => {
  const valid = buildTutorReply(teaching(), input);
  assert.deepEqual(
    valid.sources.map((s) => s.url),
    ["/topics/mux#section-0"],
  );
  assert.ok(!("text" in valid.sources[0]));
  for (const citationIds of [[], ["invented"]]) {
    assert.equal(
      buildTutorReply({ ...output, citationIds }, input).content,
      INSUFFICIENT_MATERIAL,
    );
  }
  const general = buildTutorReply(
    {
      ...output,
      grounding: "general",
      citationIds: [],
      message: "[Click](https://untrusted.test) https://untrusted.test",
    },
    input,
  );
  assert.match(general.content, /^Общие знания/);
  assert.ok(!general.content.includes("https://"));
  assert.deepEqual(general.sources, []);
  assert.equal(
    buildTutorReply(
      { ...output, citationIds: [], grounding: "insufficient" },
      input,
    ).content,
    INSUFFICIENT_MATERIAL,
  );
});

test("provider history is bounded by recent messages and UTF-8 bytes", () => {
  const history = Array.from({ length: 100 }, (_, i) => ({
    role: "user" as const,
    content: `message ${i}`,
  }));
  assert.deepEqual(boundedHistory(history), history.slice(-12));
  const large = boundedHistory(
    history.map((h) => ({ ...h, content: h.content + "я".repeat(1000) })),
  );
  assert.ok(large.length < 12);
  assert.ok(
    large.reduce((sum, h) => sum + Buffer.byteLength(h.content), 0) <= 9000,
  );
});

test("missing/unsupported provider configuration returns unavailable without printing credentials", () => {
  const keys = [
    "OPENAI_API_KEY",
    "TUTOR_MODEL",
    "TUTOR_EMBEDDING_MODEL",
    "TUTOR_PROVIDER",
  ] as const;
  const original = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  try {
    for (const key of keys) delete process.env[key];
    assert.equal(getTutorProvider(), null);
    process.env.OPENAI_API_KEY = "test-only";
    process.env.TUTOR_MODEL = "test-only";
    assert.equal(getTutorProvider(), null);
    process.env.TUTOR_EMBEDDING_MODEL = "test-only";
    assert.ok(getTutorProvider());
    process.env.TUTOR_PROVIDER = "unsupported";
    assert.equal(getTutorProvider(), null);
  } finally {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});

test("Responses adapter requests structured, non-stored output and restricts exercise source payload", async () => {
  const bodies: Record<string, unknown>[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(init!.body as string);
    bodies.push(body);
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.ok(!JSON.stringify(body).includes(config.apiKey));
    return response(
      body.text.format.name === "tutor_guided"
        ? { kind: "guided", action: "why" }
        : teaching(),
    );
  };
  const provider = createOpenAiTutorProvider(config, fetcher);
  assert.deepEqual(await provider.generateTutorResponse(input), teaching());
  await provider.generateTutorResponse({
    ...input,
    context: {
      ...input.context,
      restricted: true,
      practiceItemId: "PRIVATE_ITEM_SENTINEL",
    },
  });
  assert.ok(!JSON.stringify(bodies[1]).includes(chunk.text));
  assert.ok(!JSON.stringify(bodies).includes("PRIVATE_ITEM_SENTINEL"));
});

test("provider rejects leaked answers in guided output, invalid output, failures and timeouts safely", async () => {
  for (const data of [
    teaching(),
    { kind: "guided", action: "why", message: "SECRET_ANSWER" },
  ]) {
    const provider = createOpenAiTutorProvider(config, async () =>
      response(data),
    );
    await assert.rejects(
      provider.generateTutorResponse({
        ...input,
        context: { ...input.context, restricted: true },
      }),
      TutorProviderError,
    );
  }
  const broken = [
    new Response("sensitive provider body", { status: 500 }),
    new Response("invalid JSON"),
    Response.json({ status: "incomplete", output: [] }),
  ];
  for (const value of broken) {
    await assert.rejects(
      createOpenAiTutorProvider(
        config,
        async () => value,
      ).generateTutorResponse(input),
      (error: Error) => {
        assert.ok(error instanceof TutorProviderError);
        assert.ok(!error.message.includes("sensitive"));
        return true;
      },
    );
  }
  const timeoutFetch: typeof fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      init!.signal!.addEventListener("abort", () =>
        reject(new Error("internal secret")),
      );
    });
  await assert.rejects(
    createOpenAiTutorProvider(config, timeoutFetch, 5).generateTutorResponse(
      input,
    ),
    (error: TutorProviderError) => error.code === "timeout",
  );
});

test("embedding adapter bounds inputs, sorts response indexes and rejects inconsistent vectors", async () => {
  const provider = createOpenAiTutorProvider(config, async () =>
    Response.json({
      data: [
        { index: 1, embedding: [0, 1] },
        { index: 0, embedding: [1, 0] },
      ],
    }),
  );
  assert.deepEqual(await provider.embedText(["one", "two"]), [
    [1, 0],
    [0, 1],
  ]);
  await assert.rejects(provider.embedText([]), TutorProviderError);
  await assert.rejects(
    provider.embedText(["я".repeat(4001)]),
    TutorProviderError,
  );
  for (const data of [
    [
      { index: 0, embedding: [1] },
      { index: 1, embedding: [1, 2] },
    ],
    [{ index: 0, embedding: [] }],
    [{ index: 1, embedding: [1] }],
  ]) {
    const invalid = createOpenAiTutorProvider(config, async () =>
      Response.json({ data }),
    );
    await assert.rejects(
      invalid.embedText(Array.from({ length: data.length }, () => "text")),
      TutorProviderError,
    );
  }
});
