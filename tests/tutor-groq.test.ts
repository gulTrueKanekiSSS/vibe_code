import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import {
  getTutorProvider,
  TutorProviderError,
} from "../src/lib/tutor/provider";
import { createGroqTutorProvider } from "../src/lib/tutor/groq-provider";
import { reserveGroqRequest } from "../src/lib/tutor/groq-budget";
import {
  buildTutorReply,
  INSUFFICIENT_MATERIAL,
  TUTOR_INSTRUCTIONS,
} from "../src/lib/tutor/policy";
import type { TutorGenerationInput } from "../src/lib/tutor/types";

const config = {
  apiKey: "TEST_GROQ_SECRET",
  model: "openai/gpt-oss-120b",
  budget: { perMinute: 1, perDay: 50 },
};
const input: TutorGenerationInput = {
  context: {
    subjectTitle: "Geometry",
    moduleTitle: "Vectors",
    topicTitle: "Projection",
    topicId: "PRIVATE_TOPIC_ID",
    sectionTitle: "Intuition",
    restricted: false,
  },
  message: "Почему это проекция?",
  history: [],
  sources: [
    {
      id: "course-source",
      topicId: "projection",
      title: "Projection",
      sectionTitle: "Intuition",
      sectionIndex: 0,
      url: "/topics/projection#section-0",
      text: "COURSE_TEXT: проекция — компонента вдоль направления.",
      retrieval: "lexical",
    },
  ],
};
const teaching = {
  kind: "teaching",
  message:
    "Projection — компонента вдоль направления. Какое направление выбрано?",
  citationIds: ["course-source"],
  grounding: "course",
};
const response = (value: unknown) =>
  Response.json({
    choices: [
      {
        finish_reason: "stop",
        message: { role: "assistant", content: JSON.stringify(value) },
      },
    ],
  });
const provider = (
  fetcher: typeof fetch,
  reserve: typeof reserveGroqRequest = async () => {},
  timeout = 25000,
) => createGroqTutorProvider(config, fetcher, timeout, reserve);
const safeError = (error: unknown, code?: string) => {
  assert.ok(error instanceof TutorProviderError);
  assert.ok(!error.message.includes("SECRET"));
  if (code) assert.equal(error.code, code);
  return true;
};

// Prisma exposes $queryRaw through a proxy; restore its own override per test.
function mockQuery(
  t: TestContext,
  query: (...args: unknown[]) => Promise<unknown>,
) {
  const original = db.$queryRaw;
  db.$queryRaw = query as typeof db.$queryRaw;
  t.after(() => {
    db.$queryRaw = original;
  });
}

test("Groq selection fails closed without its key/config and never falls back to configured OpenAI", async (t) => {
  const keys = [
    "TUTOR_PROVIDER",
    "GROQ_API_KEY",
    "GROQ_TUTOR_MODEL",
    "GROQ_TUTOR_REQUESTS_PER_MINUTE",
    "GROQ_TUTOR_REQUESTS_PER_DAY",
    "OPENAI_API_KEY",
    "TUTOR_MODEL",
    "TUTOR_EMBEDDING_MODEL",
  ];
  const original = keys.map((k) => process.env[k]);
  try {
    keys.forEach((k) => delete process.env[k]);
    Object.assign(process.env, {
      TUTOR_PROVIDER: "groq",
      OPENAI_API_KEY: "OTHER_SECRET",
      TUTOR_MODEL: "other",
      TUTOR_EMBEDDING_MODEL: "other",
    });
    assert.equal(getTutorProvider(), null);
    process.env.GROQ_API_KEY = " ";
    assert.equal(getTutorProvider(), null);
    process.env.GROQ_API_KEY = config.apiKey;
    const budgets: unknown[] = [];
    mockQuery(t, async (...args: unknown[]) => {
      budgets.push(args);
      return [{ provider: "groq" }];
    });
    const models: string[] = [];
    t.mock.method(
      globalThis,
      "fetch",
      async (_url: unknown, init: RequestInit) => {
        models.push(JSON.parse(init.body as string).model);
        return response(teaching);
      },
    );
    assert.equal(getTutorProvider()!.embeddingModel, "");
    await getTutorProvider()!.generateTutorResponse(input);
    assert.equal(models[0], "openai/gpt-oss-120b");
    process.env.GROQ_TUTOR_MODEL = "openai/gpt-oss-20b";
    await getTutorProvider()!.generateTutorResponse(input);
    assert.equal(models[1], "openai/gpt-oss-20b");
    assert.equal(budgets.length, 2);
    for (const bad of [
      "https://host/model",
      "../secret",
      "model?key=x",
      "model/a/b",
    ]) {
      process.env.GROQ_TUTOR_MODEL = bad;
      assert.equal(getTutorProvider(), null);
    }
    delete process.env.GROQ_TUTOR_MODEL;
    for (const key of [
      "GROQ_TUTOR_REQUESTS_PER_MINUTE",
      "GROQ_TUTOR_REQUESTS_PER_DAY",
    ]) {
      for (const bad of ["", "-1", "1.5", "Infinity", "1e2", "1001"]) {
        process.env[key] = bad;
        assert.equal(getTutorProvider(), null);
      }
      process.env[key] = "0";
      assert.ok(getTutorProvider());
      delete process.env[key];
    }
    process.env.TUTOR_PROVIDER = "disabled";
    assert.equal(getTutorProvider(), null);
    process.env.TUTOR_PROVIDER = "openai";
    assert.ok(getTutorProvider());
  } finally {
    keys.forEach((key, i) => {
      if (original[i] === undefined) delete process.env[key];
      else process.env[key] = original[i];
    });
  }
});

test("Groq uses fixed HTTPS chat endpoint, shared teaching rules, strict schema and server-only headers", async () => {
  let reserved = false;
  const p = provider(
    async (url, init) => {
      assert.equal(reserved, true);
      assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
      assert.equal(
        new Headers(init!.headers).get("Authorization"),
        `Bearer ${config.apiKey}`,
      );
      assert.equal(init!.cache, "no-store");
      assert.equal(init!.redirect, "error");
      const body = JSON.parse(init!.body as string);
      assert.equal(body.model, config.model);
      assert.equal(body.stream, false);
      assert.equal(body.max_completion_tokens, 1200);
      assert.equal(body.reasoning_format, "hidden");
      assert.deepEqual(body.messages[0], {
        role: "system",
        content: TUTOR_INSTRUCTIONS,
      });
      assert.equal(body.response_format.type, "json_schema");
      assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(
        body.response_format.json_schema.schema.additionalProperties,
        false,
      );
      assert.deepEqual(body.response_format.json_schema.schema.required, [
        "kind",
        "message",
        "citationIds",
        "grounding",
      ]);
      const data = JSON.parse(body.messages.at(-1).content);
      assert.equal(data.sources[0].id, "course-source");
      assert.ok(!String(init!.body).includes(config.apiKey));
      assert.ok(!String(init!.body).includes("PRIVATE_TOPIC_ID"));
      return response(teaching);
    },
    async (limits) => {
      assert.deepEqual(limits, config.budget);
      reserved = true;
    },
  );
  const output = await p.generateTutorResponse(input);
  assert.deepEqual(output, teaching);
  assert.equal(
    buildTutorReply(output, input).sources[0].url,
    "/topics/projection#section-0",
  );
});

test("Groq invented citations and general knowledge use the existing server citation policy", async () => {
  const invented = await provider(async () =>
    response({ ...teaching, citationIds: ["invented"] }),
  ).generateTutorResponse(input);
  assert.deepEqual(buildTutorReply(invented, input), {
    content: INSUFFICIENT_MATERIAL,
    sources: [],
  });
  const general = await provider(async () =>
    response({ ...teaching, citationIds: [], grounding: "general" }),
  ).generateTutorResponse(input);
  assert.match(buildTutorReply(general, input).content, /^Общие знания/);
  assert.deepEqual(buildTutorReply(general, input).sources, []);
});

test("Groq restricted exercises can only select coaching actions, never author a displayed answer", async () => {
  const restricted = {
    ...input,
    context: {
      ...input.context,
      restricted: true,
      practiceItemId: "PRIVATE_ITEM",
    },
    exercise: {
      prompt: "Определи проекцию",
      difficulty: "MEDIUM",
      attemptCount: 1,
      studentAnswer: "моя попытка",
      hintsUsed: [],
    },
  };
  const p = provider(async (_url, init) => {
    const body = JSON.parse(init!.body as string);
    assert.equal(body.max_completion_tokens, 150);
    assert.deepEqual(body.response_format.json_schema.schema.required, [
      "kind",
      "action",
    ]);
    assert.deepEqual(JSON.parse(body.messages.at(-1).content).sources, []);
    assert.ok(!String(init!.body).includes("COURSE_TEXT"));
    assert.ok(!String(init!.body).includes("PRIVATE_ITEM"));
    return response({ kind: "guided", action: "why" });
  });
  const output = await p.generateTutorResponse(restricted);
  assert.equal(output.kind, "guided");
  assert.match(
    buildTutorReply(output, restricted).content,
    /Найдём точное место/,
  );
  for (const bad of [
    teaching,
    { kind: "guided", action: "reveal" },
    { kind: "guided", action: "why", message: "SECRET_ANSWER" },
  ])
    await assert.rejects(
      provider(async () => response(bad)).generateTutorResponse(restricted),
      (e) => safeError(e, "invalid_response"),
    );
});

test("Groq validates request bounds before reserving quota or network and bounds history", async () => {
  let reservations = 0,
    calls = 0;
  const p = provider(
    async (_url, init) => {
      calls++;
      const history = JSON.parse(init!.body as string).messages.slice(1, -1);
      assert.ok(history.length <= 12);
      assert.ok(
        history.reduce(
          (n: number, h: { content: string }) =>
            n + Buffer.byteLength(h.content),
          0,
        ) <= 9000,
      );
      assert.ok(history.at(-1).content.startsWith("recent-99"));
      return response(teaching);
    },
    async () => {
      reservations++;
    },
  );
  await assert.rejects(
    p.generateTutorResponse({ ...input, message: "я".repeat(13000) }),
    (e) => safeError(e, "invalid_response"),
  );
  assert.equal(reservations, 0);
  assert.equal(calls, 0);
  await p.generateTutorResponse({
    ...input,
    history: Array.from({ length: 100 }, (_, i) => ({
      role: "user",
      content: `recent-${i}` + "я".repeat(1000),
    })),
  });
  assert.equal(calls, 1);
  assert.equal(reservations, 1);
});

test("Groq rejects truncated, refused, malformed, ambiguous or schema-invalid choices", async () => {
  const good = {
    finish_reason: "stop",
    message: { role: "assistant", content: JSON.stringify(teaching) },
  };
  for (const bad of [
    null,
    {},
    { choices: [] },
    { choices: [null] },
    { choices: [good, good] },
    ...["length", "content_filter", "tool_calls"].map((finish_reason) => ({
      choices: [{ ...good, finish_reason }],
    })),
    { choices: [{ ...good, message: { ...good.message, refusal: "SECRET" } }] },
    { choices: [{ ...good, message: { role: "user", content: "SECRET" } }] },
    {
      choices: [
        { ...good, message: { role: "assistant", content: "SECRET_NOT_JSON" } },
      ],
    },
    {
      choices: [
        {
          ...good,
          message: {
            ...good.message,
            content: JSON.stringify({ ...teaching, injected: "SECRET" }),
          },
        },
      ],
    },
    {
      choices: [
        {
          ...good,
          message: {
            ...good.message,
            content: JSON.stringify({ ...teaching, message: "x".repeat(3501) }),
          },
        },
      ],
    },
  ])
    await assert.rejects(
      provider(async () => Response.json(bad)).generateTutorResponse(input),
      (e) => safeError(e, "invalid_response"),
    );
});

test("Groq 429 and provider failures are sanitized, consume one reservation, never retry or fall back", async () => {
  for (const status of [301, 401, 403, 429, 500]) {
    let calls = 0,
      reservations = 0;
    await assert.rejects(
      provider(
        async () => {
          calls++;
          return new Response("SECRET_PROVIDER_BODY", { status });
        },
        async () => {
          reservations++;
        },
      ).generateTutorResponse(input),
      (e) => safeError(e, status === 429 ? "rate_limited" : "unavailable"),
    );
    assert.equal(calls, 1);
    assert.equal(reservations, 1);
  }
  for (const make of [
    () => new Response("SECRET_NOT_JSON"),
    () => new Response(null),
    () => new Response("x".repeat(2_000_001)),
  ])
    await assert.rejects(
      provider(async () => make()).generateTutorResponse(input),
      safeError,
    );
  await assert.rejects(
    provider(async () => {
      throw new Error("SECRET_NETWORK");
    }).generateTutorResponse(input),
    safeError,
  );
});

test("Groq aborts timed-out HTTP without retrying", async () => {
  let calls = 0;
  await assert.rejects(
    provider(
      async (_url, init) => {
        calls++;
        return new Promise((_resolve, reject) =>
          init!.signal!.addEventListener(
            "abort",
            () => reject(new Error("SECRET_ABORT")),
            { once: true },
          ),
        );
      },
      undefined,
      5,
    ).generateTutorResponse(input),
    (e) => safeError(e, "timeout"),
  );
  assert.equal(calls, 1);
});

test("Groq has no embedding API and exhausted DB reservation prevents any HTTP call", async (t) => {
  let calls = 0;
  const p = provider(async () => {
    calls++;
    return response(teaching);
  }, reserveGroqRequest);
  await assert.rejects(p.embedText(["text"]), (e) =>
    safeError(e, "unavailable"),
  );
  mockQuery(t, async () => []);
  await assert.rejects(p.generateTutorResponse(input), (e) =>
    safeError(e, "rate_limited"),
  );
  assert.equal(calls, 0);
});

test("Groq DB outage fails closed without leaking SQL/credentials or calling HTTP", async (t) => {
  mockQuery(t, async () => {
    throw new Error("SECRET_DATABASE_URL_AND_SQL");
  });
  let calls = 0;
  await assert.rejects(
    provider(async () => {
      calls++;
      return response(teaching);
    }, reserveGroqRequest).generateTutorResponse(input),
    (e) => safeError(e, "unavailable"),
  );
  assert.equal(calls, 0);
});
