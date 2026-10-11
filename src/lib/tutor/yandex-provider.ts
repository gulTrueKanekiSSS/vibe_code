import { setTimeout as delay } from "node:timers/promises";
import { boundedHistory, TUTOR_INSTRUCTIONS } from "./policy";
import {
  TutorProviderError,
  requestProviderJson,
  tutorInputData,
  tutorOutputSchema,
  parseTutorOutput,
  validateEmbeddingTexts,
  validateVectors,
} from "./provider-common";
import type { TutorProvider } from "./types";

type Config = {
  apiKey: string;
  folderId: string;
  model: string;
  embeddingModel: string;
  queryEmbeddingModel: string;
};

// Conservative byte bound below the 2048-token limit, preserving all Unicode text.
function embeddingParts(text: string): string[] {
  const parts: string[] = [];
  let part = "",
    bytes = 0;
  for (const char of text) {
    const size = Buffer.byteLength(char, "utf8");
    if (bytes + size > 1800) {
      parts.push(part);
      part = "";
      bytes = 0;
    }
    part += char;
    bytes += size;
  }
  if (part) parts.push(part);
  return parts;
}

// Native Yandex API, not a proxy to OpenAI. No automatic cross-provider fallback.
export function createYandexTutorProvider(
  config: Config,
  fetcher: typeof fetch = fetch,
  timeoutMs = 25000,
): TutorProvider {
  const docUri = `emb://${config.folderId}/${config.embeddingModel}`;
  const queryUri = `emb://${config.folderId}/${config.queryEmbeddingModel}`;
  const request = (
    path: "completion" | "textEmbedding",
    payload: unknown,
    budget = timeoutMs,
  ) =>
    requestProviderJson(
      `https://ai.api.cloud.yandex.net/foundationModels/v1/${path}`,
      {
        Authorization: `Api-Key ${config.apiKey}`,
        "x-folder-id": config.folderId,
        "x-data-logging-enabled": "false",
      },
      payload,
      fetcher,
      budget,
    );
  let nextEmbeddingAt = 0;
  return {
    // Pair identity invalidates stored vectors when either configured model changes.
    embeddingModel: `yandex:mean1800-v1:${docUri}|${queryUri}`,
    async embedText(texts, purpose = "document") {
      validateEmbeddingTexts(texts);
      const vectors: number[][] = [];
      const deadline = purpose === "query" ? Date.now() + timeoutMs : Infinity;
      // Native API accepts one text, not OpenAI-style batches. Bounded concurrency.
      for (const text of texts) {
        const parts = embeddingParts(text);
        const partVectors: unknown[] = [];
        for (const part of parts) {
          // Pace this adapter/indexer below the default 10 embedding requests/sec.
          const wait = Math.max(0, nextEmbeddingAt - Date.now());
          if (wait >= deadline - Date.now())
            throw new TutorProviderError("timeout");
          if (wait) await delay(wait);
          const budget = Math.min(timeoutMs, deadline - Date.now());
          if (budget <= 0) throw new TutorProviderError("timeout");
          nextEmbeddingAt = Date.now() + 110;
          const result = (await request(
            "textEmbedding",
            {
              modelUri: purpose === "query" ? queryUri : docUri,
              text: part,
            },
            budget,
          )) as { embedding?: unknown };
          // Native REST documents doubles as strings; reject coercible non-numbers.
          const vector = result?.embedding;
          partVectors.push(
            Array.isArray(vector)
              ? vector.map((n: unknown) =>
                  typeof n === "string" &&
                  /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(n)
                    ? Number(n)
                    : n,
                )
              : vector,
          );
        }
        const valid = validateVectors(partVectors, parts.length);
        // Approximate a long-text vector with a byte-weighted mean. No tail loss,
        // and existing course chunk/citation IDs remain unchanged.
        const total = Buffer.byteLength(text, "utf8");
        vectors.push(
          valid[0].map((_, dimension) =>
            valid.reduce(
              (sum, vector, i) =>
                sum +
                vector[dimension] *
                  (Buffer.byteLength(parts[i], "utf8") / total),
              0,
            ),
          ),
        );
      }
      return validateVectors(vectors, texts.length);
    },
    async generateTutorResponse(input) {
      const restricted = input.context.restricted;
      const result = (await request("completion", {
        modelUri: `gpt://${config.folderId}/${config.model}`,
        completionOptions: {
          stream: false,
          temperature: 0.3,
          maxTokens: restricted ? "150" : "1200",
        },
        messages: [
          { role: "system", text: TUTOR_INSTRUCTIONS },
          ...boundedHistory(input.history).map((h) => ({
            role: h.role,
            text: h.content,
          })),
          { role: "user", text: tutorInputData(input) },
        ],
        jsonSchema: { schema: tutorOutputSchema(restricted) },
      })) as {
        result?: {
          alternatives?: {
            status?: string;
            message?: { role?: string; text?: string };
          }[];
        };
      };
      const alternatives = result?.result?.alternatives;
      const answer =
        Array.isArray(alternatives) && alternatives.length === 1
          ? alternatives[0]
          : undefined;
      if (
        answer?.status !== "ALTERNATIVE_STATUS_FINAL" ||
        answer.message?.role !== "assistant" ||
        typeof answer.message.text !== "string"
      )
        throw new TutorProviderError("invalid_response");
      return parseTutorOutput(answer.message.text, restricted);
    },
  };
}
