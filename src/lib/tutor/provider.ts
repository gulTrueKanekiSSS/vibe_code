import { env } from "node:process";
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
import { createYandexTutorProvider } from "./yandex-provider";
import type { TutorProvider } from "./types";

export { TutorProviderError } from "./provider-common";
type Config = { apiKey: string; model: string; embeddingModel: string };

// REST adapter isolated here: application services depend only on TutorProvider.
export function createOpenAiTutorProvider(
  config: Config,
  fetcher: typeof fetch = fetch,
  timeoutMs = 25000,
): TutorProvider {
  const request = (path: "responses" | "embeddings", payload: unknown) =>
    requestProviderJson(
      `https://api.openai.com/v1/${path}`,
      { Authorization: `Bearer ${config.apiKey}` },
      payload,
      fetcher,
      timeoutMs,
    );
  return {
    embeddingModel: `openai:${config.embeddingModel}`,
    async embedText(texts) {
      validateEmbeddingTexts(texts);
      const result = (await request("embeddings", {
        model: config.embeddingModel,
        input: texts,
        encoding_format: "float",
      })) as { data?: { index: number; embedding: number[] }[] };
      if (!Array.isArray(result?.data) || result.data.some((e) => !e))
        throw new TutorProviderError("invalid_response");
      const entries = [...result.data].sort((a, b) => a.index - b.index);
      if (entries.some((e, i) => e.index !== i))
        throw new TutorProviderError("invalid_response");
      return validateVectors(
        entries.map((e) => e.embedding),
        texts.length,
      );
    },
    async generateTutorResponse(input) {
      const restricted = input.context.restricted;
      const result = (await request("responses", {
        model: config.model,
        store: false,
        max_output_tokens: restricted ? 150 : 1200,
        instructions: TUTOR_INSTRUCTIONS,
        input: [
          ...boundedHistory(input.history).map((h) => ({
            role: h.role,
            content: h.content,
          })),
          { role: "user", content: tutorInputData(input) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: restricted ? "tutor_guided" : "tutor_teaching",
            strict: true,
            schema: tutorOutputSchema(restricted),
          },
        },
      })) as {
        status?: string;
        output?: {
          type: string;
          content?: { type: string; text?: string }[];
        }[];
      };
      if (result?.status !== "completed" || !Array.isArray(result.output))
        throw new TutorProviderError("invalid_response");
      try {
        const text = result.output
          .filter((o) => o.type === "message")
          .flatMap((o) => o.content ?? [])
          .filter((c) => c.type === "output_text")
          .map((c) => c.text ?? "")
          .join("");
        return parseTutorOutput(text, restricted);
      } catch {
        throw new TutorProviderError("invalid_response");
      }
    },
  };
}

export function getTutorProvider(): TutorProvider | null {
  const provider = env.TUTOR_PROVIDER?.trim() || "openai";
  if (provider === "yandex") {
    const apiKey = env.YANDEX_API_KEY?.trim();
    const folderId = env.YANDEX_FOLDER_ID?.trim();
    if (!apiKey || !folderId || !/^[a-zA-Z0-9_-]{1,100}$/.test(folderId))
      return null;
    const model = env.YANDEX_TUTOR_MODEL?.trim() || "yandexgpt-5.1";
    const embeddingModel =
      env.YANDEX_EMBEDDING_MODEL?.trim() || "text-search-doc/latest";
    const queryEmbeddingModel =
      env.YANDEX_QUERY_EMBEDDING_MODEL?.trim() || "text-search-query/latest";
    // Model names, not arbitrary URLs/folders; endpoints remain fixed in the adapter.
    if (
      ![model, embeddingModel, queryEmbeddingModel].every((m) =>
        /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*(\/[a-zA-Z0-9_-]+)?$/.test(m),
      )
    )
      return null;
    return createYandexTutorProvider({
      apiKey,
      folderId,
      model,
      embeddingModel,
      queryEmbeddingModel,
    });
  }
  if (provider !== "openai") return null;
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.TUTOR_MODEL?.trim();
  const embeddingModel = env.TUTOR_EMBEDDING_MODEL?.trim();
  return apiKey && model && embeddingModel
    ? createOpenAiTutorProvider({ apiKey, model, embeddingModel })
    : null;
}
