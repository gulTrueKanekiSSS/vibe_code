import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getTutorProvider,
  TutorProviderError,
} from "../src/lib/tutor/provider";
import { createYandexTutorProvider } from "../src/lib/tutor/yandex-provider";
import type { TutorGenerationInput } from "../src/lib/tutor/types";

const config = {
  apiKey: "TEST_KEY_DO_NOT_EXPOSE",
  folderId: "test-folder",
  model: "yandexgpt-5.1",
  embeddingModel: "text-search-doc/latest",
  queryEmbeddingModel: "text-search-query/latest",
};
const input: TutorGenerationInput = {
  context: {
    subjectTitle: "Architecture",
    moduleTitle: "Logic",
    topicTitle: "Multiplexer",
    topicId: "PRIVATE_TOPIC_ID",
    sectionTitle: "Selection",
    restricted: false,
  },
  message: "Почему NOT S?",
  history: [],
  sources: [
    {
      id: "course-source",
      title: "Multiplexer",
      topicId: "PRIVATE_TOPIC_ID",
      sectionTitle: "Selection",
      sectionIndex: 0,
      url: "/topics/private",
      text: "COURSE_TEXT_SENTINEL: NOT S selects the input for S = 0.",
      retrieval: "semantic",
    },
  ],
};
const teaching = {
  kind: "teaching",
  message: "При S=0 получаем NOT S=1. Чему тогда равно I2 AND S?",
  grounding: "course",
  citationIds: ["course-source"],
};
const response = (value: unknown) =>
  Response.json({
    result: {
      alternatives: [
        {
          status: "ALTERNATIVE_STATUS_FINAL",
          message: { role: "assistant", text: JSON.stringify(value) },
        },
      ],
    },
  });
const unavailable = (error: unknown) => {
  assert.ok(error instanceof TutorProviderError);
  assert.ok(!error.message.includes("SECRET"));
  assert.ok(!error.message.includes(config.apiKey));
  return true;
};
const envKeys = [
  "TUTOR_PROVIDER",
  "OPENAI_API_KEY",
  "TUTOR_MODEL",
  "TUTOR_EMBEDDING_MODEL",
  "YANDEX_API_KEY",
  "YANDEX_FOLDER_ID",
  "YANDEX_TUTOR_MODEL",
  "YANDEX_EMBEDDING_MODEL",
  "YANDEX_QUERY_EMBEDDING_MODEL",
] as const;

test("Yandex factory requires its own credentials, never falls back, and accepts explicit safe model names", async (t) => {
  const original = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  );
  try {
    for (const key of envKeys) delete process.env[key];
    Object.assign(process.env, {
      TUTOR_PROVIDER: "yandex",
      OPENAI_API_KEY: "OPENAI_SECRET",
      TUTOR_MODEL: "other-provider",
      TUTOR_EMBEDDING_MODEL: "other-provider",
    });
    assert.equal(getTutorProvider(), null);
    process.env.YANDEX_API_KEY = config.apiKey;
    assert.equal(getTutorProvider(), null);
    process.env.YANDEX_FOLDER_ID = config.folderId;
    delete process.env.OPENAI_API_KEY;
    delete process.env.TUTOR_MODEL;
    delete process.env.TUTOR_EMBEDDING_MODEL;
    let requestedModel: unknown;
    t.mock.method(
      globalThis,
      "fetch",
      async (_url: unknown, init: RequestInit) => {
        requestedModel = JSON.parse(init.body as string).modelUri;
        return response(teaching);
      },
    );
    const provider = getTutorProvider();
    assert.ok(provider);
    assert.ok(provider.embeddingModel.startsWith("yandex:"));
    assert.ok(
      provider.embeddingModel.includes(
        "emb://test-folder/text-search-doc/latest",
      ),
    );
    assert.ok(
      provider.embeddingModel.includes(
        "emb://test-folder/text-search-query/latest",
      ),
    );
    await provider.generateTutorResponse(input);
    assert.equal(requestedModel, "gpt://test-folder/yandexgpt-5.1");
    for (const model of ["yandexgpt-5.1", "yandexgpt-5.1/latest"]) {
      process.env.YANDEX_TUTOR_MODEL = model;
      assert.ok(getTutorProvider());
    }
    for (const model of [
      "https://host/model",
      "../secret",
      "model/a/b",
      "model?key=secret",
    ]) {
      process.env.YANDEX_TUTOR_MODEL = model;
      assert.equal(getTutorProvider(), null);
    }
    delete process.env.YANDEX_TUTOR_MODEL;
    process.env.YANDEX_FOLDER_ID = "../other-folder";
    assert.equal(getTutorProvider(), null);
    process.env.YANDEX_FOLDER_ID = config.folderId;
    process.env.TUTOR_PROVIDER = "unsupported";
    assert.equal(getTutorProvider(), null);
    process.env.TUTOR_PROVIDER = "openai";
    assert.equal(getTutorProvider(), null);
  } finally {
    for (const key of envKeys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});

test("Yandex completion uses fixed endpoint, disabled logging, schema and private server headers", async () => {
  const provider = createYandexTutorProvider(config, async (url, init) => {
    assert.equal(
      url,
      "https://ai.api.cloud.yandex.net/foundationModels/v1/completion",
    );
    assert.equal(init!.method, "POST");
    assert.equal(init!.cache, "no-store");
    assert.equal(init!.redirect, "error");
    const headers = new Headers(init!.headers);
    assert.equal(headers.get("Authorization"), `Api-Key ${config.apiKey}`);
    assert.equal(headers.get("x-folder-id"), config.folderId);
    assert.equal(headers.get("x-data-logging-enabled"), "false");
    const body = JSON.parse(init!.body as string);
    assert.equal(body.modelUri, "gpt://test-folder/yandexgpt-5.1");
    assert.equal(body.completionOptions.stream, false);
    assert.equal(body.completionOptions.maxTokens, "1200");
    assert.equal(body.messages[0].role, "system");
    assert.equal(body.jsonSchema.schema.additionalProperties, false);
    const data = JSON.parse(body.messages.at(-1).text);
    assert.equal(data.sources[0].id, "course-source");
    assert.equal(data.context.sectionTitle, "Selection");
    assert.ok(!JSON.stringify(body).includes(config.apiKey));
    assert.ok(!JSON.stringify(body).includes("PRIVATE_TOPIC_ID"));
    return response(teaching);
  });
  assert.deepEqual(await provider.generateTutorResponse(input), teaching);
});

test("Yandex restricted exercises omit lesson sources and private IDs and accept only coaching actions", async () => {
  const restricted: TutorGenerationInput = {
    ...input,
    context: {
      ...input.context,
      restricted: true,
      practiceItemId: "PRIVATE_PRACTICE_ID",
    },
    exercise: {
      prompt: "Determine the active input.",
      difficulty: "easy",
      studentAnswer: "I2",
      attemptCount: 1,
      hintsUsed: [],
    },
  };
  const provider = createYandexTutorProvider(config, async (_url, init) => {
    const body = JSON.parse(init!.body as string);
    assert.equal(body.completionOptions.maxTokens, "150");
    assert.deepEqual(body.jsonSchema.schema.required, ["kind", "action"]);
    const data = JSON.parse(body.messages.at(-1).text);
    assert.deepEqual(data.sources, []);
    assert.equal(data.exercise.studentAnswer, "I2");
    assert.ok(!JSON.stringify(body).includes("COURSE_TEXT_SENTINEL"));
    assert.ok(!JSON.stringify(body).includes("PRIVATE_PRACTICE_ID"));
    return response({ kind: "guided", action: "why" });
  });
  assert.deepEqual(await provider.generateTutorResponse(restricted), {
    kind: "guided",
    action: "why",
  });
  for (const value of [
    teaching,
    { kind: "guided", action: "why", message: "SECRET_ANSWER" },
    { kind: "guided", action: "reveal" },
  ]) {
    await assert.rejects(
      createYandexTutorProvider(config, async () =>
        response(value),
      ).generateTutorResponse(restricted),
      unavailable,
    );
  }
});

test("Yandex completion sends bounded recent history and rejects oversized input before network", async () => {
  let calls = 0;
  const provider = createYandexTutorProvider(config, async (_url, init) => {
    calls++;
    const body = JSON.parse(init!.body as string);
    const history = body.messages.slice(1, -1);
    assert.ok(history.length <= 12);
    assert.ok(
      history.reduce(
        (sum: number, h: { text: string }) => sum + Buffer.byteLength(h.text),
        0,
      ) <= 9000,
    );
    assert.equal(history.at(-1).text, "recent-99" + "я".repeat(1000));
    assert.ok(!JSON.stringify(history).includes("recent-0я"));
    return response(teaching);
  });
  await provider.generateTutorResponse({
    ...input,
    history: Array.from({ length: 100 }, (_, i) => ({
      role: "user",
      content: `recent-${i}` + "я".repeat(1000),
    })),
  });
  await assert.rejects(
    provider.generateTutorResponse({ ...input, message: "я".repeat(13000) }),
    unavailable,
  );
  assert.equal(calls, 1);
});

test("Yandex rejects partial/refused/malformed generation instead of exposing unvalidated model text", async () => {
  const good = {
    status: "ALTERNATIVE_STATUS_FINAL",
    message: { role: "assistant", text: JSON.stringify(teaching) },
  };
  const results = [
    null,
    {},
    { result: {} },
    { result: { alternatives: [] } },
    { result: { alternatives: [good, good] } },
    { result: { alternatives: [null] } },
    ...[
      "ALTERNATIVE_STATUS_PARTIAL",
      "ALTERNATIVE_STATUS_TRUNCATED_FINAL",
      "ALTERNATIVE_STATUS_CONTENT_FILTER",
    ].map((status) => ({ result: { alternatives: [{ ...good, status }] } })),
    {
      result: {
        alternatives: [{ ...good, message: { role: "user", text: "SECRET" } }],
      },
    },
    {
      result: {
        alternatives: [
          { ...good, message: { role: "assistant", text: "not JSON SECRET" } },
        ],
      },
    },
    {
      result: {
        alternatives: [
          {
            ...good,
            message: {
              role: "assistant",
              text: JSON.stringify({ ...teaching, injected: "SECRET" }),
            },
          },
        ],
      },
    },
  ];
  for (const result of results) {
    await assert.rejects(
      createYandexTutorProvider(config, async () =>
        Response.json(result),
      ).generateTutorResponse(input),
      unavailable,
    );
  }
});

test("Yandex failures, redirects, oversized response bodies and network errors stay sanitized", async () => {
  for (const status of [301, 401, 403, 429, 500]) {
    await assert.rejects(
      createYandexTutorProvider(
        config,
        async () => new Response("SECRET_PROVIDER_BODY", { status }),
      ).generateTutorResponse(input),
      (error: unknown) =>
        unavailable(error) &&
        (error as TutorProviderError).code === "unavailable",
    );
  }
  for (const make of [
    () => new Response("SECRET_INVALID_JSON"),
    () => new Response(null),
    () => new Response("x".repeat(2_000_001)),
  ]) {
    await assert.rejects(
      createYandexTutorProvider(config, async () =>
        make(),
      ).generateTutorResponse(input),
      unavailable,
    );
  }
  await assert.rejects(
    createYandexTutorProvider(config, async () => {
      throw new Error("SECRET_NETWORK");
    }).generateTutorResponse(input),
    unavailable,
  );
});

test("Yandex generation and embeddings abort with safe timeout errors", async () => {
  const fetcher: typeof fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      init!.signal!.addEventListener(
        "abort",
        () => reject(new Error("SECRET_ABORT")),
        { once: true },
      );
    });
  const provider = createYandexTutorProvider(config, fetcher, 5);
  for (const operation of [
    () => provider.generateTutorResponse(input),
    () => provider.embedText(["text"]),
  ]) {
    await assert.rejects(
      operation,
      (error: unknown) =>
        unavailable(error) && (error as TutorProviderError).code === "timeout",
    );
  }
});

test("Yandex native embeddings choose document/query models, preserve order and decode decimal strings", async () => {
  const requests: { modelUri: string; text: string }[] = [];
  const provider = createYandexTutorProvider(config, async (url, init) => {
    assert.equal(
      url,
      "https://ai.api.cloud.yandex.net/foundationModels/v1/textEmbedding",
    );
    assert.equal(
      new Headers(init!.headers).get("x-data-logging-enabled"),
      "false",
    );
    requests.push(JSON.parse(init!.body as string));
    assert.ok(!String(init!.body).includes(config.apiKey));
    return Response.json({
      embedding: [String(requests.length), "-1.25e-2", 0],
    });
  });
  assert.deepEqual(await provider.embedText(["first", "second"], "document"), [
    [1, -0.0125, 0],
    [2, -0.0125, 0],
  ]);
  assert.deepEqual(await provider.embedText(["question"], "query"), [
    [3, -0.0125, 0],
  ]);
  await provider.embedText(["default document"]);
  assert.deepEqual(
    requests.map((r) => r.text),
    ["first", "second", "question", "default document"],
  );
  assert.deepEqual(
    requests.map((r) => r.modelUri),
    [
      "emb://test-folder/text-search-doc/latest",
      "emb://test-folder/text-search-doc/latest",
      "emb://test-folder/text-search-query/latest",
      "emb://test-folder/text-search-doc/latest",
    ],
  );
});

test("Yandex vector cache identity includes provider, folder and both embedding models", () => {
  const identity = createYandexTutorProvider(config).embeddingModel;
  for (const changed of [
    { folderId: "another-folder" },
    { embeddingModel: "text-search-doc/new" },
    { queryEmbeddingModel: "text-search-query/new" },
  ])
    assert.notEqual(
      createYandexTutorProvider({ ...config, ...changed }).embeddingModel,
      identity,
    );
  assert.equal(
    createYandexTutorProvider({ ...config, model: "another-generator" })
      .embeddingModel,
    identity,
  );
  assert.ok(identity.startsWith("yandex:"));
});

test("Yandex long Unicode text is embedded completely in bounded parts with stable weighted pooling", async () => {
  const text = "Проекция😀 и угол α. ".repeat(200);
  assert.ok(Buffer.byteLength(text) > 1800);
  assert.ok(Buffer.byteLength(text) <= 8000);
  const parts: string[] = [];
  const provider = createYandexTutorProvider(config, async (_url, init) => {
    const body = JSON.parse(init!.body as string);
    assert.ok(Buffer.byteLength(body.text) <= 1800);
    assert.ok(body.text.length > 0);
    assert.ok(!body.text.includes("\uFFFD"));
    parts.push(body.text);
    return Response.json({ embedding: ["0.25", "-0.75"] });
  });
  const [vector] = await provider.embedText([text]);
  assert.ok(parts.length > 1);
  assert.equal(parts.join(""), text);
  assert.equal(vector.length, 2);
  assert.ok(vector.every(Number.isFinite));
  assert.ok(Math.abs(vector[0] - 0.25) < 1e-12);
  assert.ok(Math.abs(vector[1] + 0.75) < 1e-12);
  assert.deepEqual(await provider.embedText([text]), [vector]);
});

test("Yandex bounds embedding text batches before any network request", async () => {
  let calls = 0;
  const provider = createYandexTutorProvider(config, async () => {
    calls++;
    return Response.json({ embedding: [1, 0] });
  });
  for (const texts of [
    [],
    Array(17).fill("text"),
    [" "],
    ["я".repeat(4001)],
    ["valid", ""],
  ]) {
    await assert.rejects(provider.embedText(texts), unavailable);
  }
  assert.equal(calls, 0);
  assert.equal((await provider.embedText(["я".repeat(4000)])).length, 1);
});

test("Yandex pools unequal parts by byte weight and versions the pooling algorithm", async () => {
  let calls = 0;
  const provider = createYandexTutorProvider(config, async () => {
    calls++;
    return Response.json({ embedding: calls === 1 ? [1, 0] : [0, 1] });
  });
  assert.deepEqual(await provider.embedText(["x".repeat(2000)]), [[0.9, 0.1]]);
  assert.equal(calls, 2);
  assert.ok(provider.embeddingModel.includes("mean1800-v1"));
});

test("Yandex query budget covers pacing and all parts, not a fresh timeout per part", async () => {
  let calls = 0;
  const provider = createYandexTutorProvider(
    config,
    async () => {
      calls++;
      return Response.json({ embedding: [1, 0] });
    },
    50,
  );
  await assert.rejects(
    provider.embedText(["x".repeat(2000)], "query"),
    (error: unknown) =>
      unavailable(error) && (error as TutorProviderError).code === "timeout",
  );
  assert.equal(calls, 1);
});

test("Yandex rejects non-finite, non-decimal, empty, oversized and inconsistent vectors", async () => {
  for (const embedding of [
    undefined,
    null,
    [],
    [true],
    [null],
    [{}],
    [""],
    [" "],
    ["NaN"],
    ["Infinity"],
    ["1e999"],
    ["0x10"],
    ["1secret"],
    Array(4097).fill(0),
  ]) {
    await assert.rejects(
      createYandexTutorProvider(config, async () =>
        Response.json({ embedding }),
      ).embedText(["text"]),
      unavailable,
    );
  }
  let calls = 0;
  await assert.rejects(
    createYandexTutorProvider(config, async () =>
      Response.json({ embedding: ++calls === 1 ? [1, 0] : [1] }),
    ).embedText(["first", "second"]),
    unavailable,
  );
});
