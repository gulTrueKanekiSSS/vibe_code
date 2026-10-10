import { env } from "node:process";
import {
  boundedHistory,
  guidedResponseSchema,
  teachingResponseSchema,
  TUTOR_INSTRUCTIONS,
} from "./policy";
import type { TutorGenerationInput, TutorProvider } from "./types";

export class TutorProviderError extends Error {
  constructor(
    public readonly code: "timeout" | "unavailable" | "invalid_response",
  ) {
    super(
      code === "timeout"
        ? "Tutor не успел ответить. Попробуй ещё раз."
        : "Сервис Tutor временно недоступен. Попробуй позже.",
    );
    this.name = "TutorProviderError";
  }
}
type Config = { apiKey: string; model: string; embeddingModel: string };
type Fetch = typeof fetch;

async function readBoundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new TutorProviderError("invalid_response");
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) {
        await reader.cancel();
        throw new TutorProviderError("invalid_response");
      }
      parts.push(value);
    }
    return JSON.parse(Buffer.concat(parts).toString("utf8"));
  } finally {
    reader.releaseLock();
  }
}

// REST adapter isolated here: application services depend only on TutorProvider.
export function createOpenAiTutorProvider(
  config: Config,
  fetcher: Fetch = fetch,
  timeoutMs = 25000,
): TutorProvider {
  async function request(
    path: "responses" | "embeddings",
    payload: unknown,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(`https://api.openai.com/v1/${path}`, {
        method: "POST",
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new TutorProviderError("unavailable");
      }
      return await readBoundedJson(response);
    } catch (error) {
      if (controller.signal.aborted) throw new TutorProviderError("timeout");
      if (error instanceof TutorProviderError) throw error;
      // Never propagate provider response bodies/headers/credentials to callers or logs.
      throw new TutorProviderError("invalid_response");
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    embeddingModel: `openai:${config.embeddingModel}`,
    async embedText(texts) {
      if (
        !texts.length ||
        texts.length > 16 ||
        texts.some((t) => !t.trim() || Buffer.byteLength(t, "utf8") > 8000)
      )
        throw new TutorProviderError("invalid_response");
      const result = (await request("embeddings", {
        model: config.embeddingModel,
        input: texts,
        encoding_format: "float",
      })) as {
        data?: { index: number; embedding: number[] }[];
      };
      if (!Array.isArray(result?.data) || result.data.length !== texts.length)
        throw new TutorProviderError("invalid_response");
      const entries = [...result.data].sort((a, b) => a.index - b.index);
      const dimension = entries[0]?.embedding?.length;
      if (
        !dimension ||
        dimension > 4096 ||
        entries.some(
          (e, i) =>
            e.index !== i ||
            !Array.isArray(e.embedding) ||
            e.embedding.length !== dimension ||
            e.embedding.some(
              (n) => typeof n !== "number" || !Number.isFinite(n),
            ),
        )
      )
        throw new TutorProviderError("invalid_response");
      return entries.map((e) => e.embedding);
    },
    async generateTutorResponse(input: TutorGenerationInput) {
      const restricted = input.context.restricted;
      const schema = restricted
        ? {
            type: "object",
            additionalProperties: false,
            required: ["kind", "action"],
            properties: {
              kind: { type: "string", enum: ["guided"] },
              action: {
                type: "string",
                enum: ["first-step", "simpler", "hint", "why", "check"],
              },
            },
          }
        : {
            type: "object",
            additionalProperties: false,
            required: ["kind", "message", "citationIds", "grounding"],
            properties: {
              kind: { type: "string", enum: ["teaching"] },
              message: { type: "string" },
              citationIds: { type: "array", items: { type: "string" } },
              grounding: {
                type: "string",
                enum: ["course", "general", "insufficient"],
              },
            },
          };
      const data = JSON.stringify({
        context: {
          subjectTitle: input.context.subjectTitle,
          moduleTitle: input.context.moduleTitle,
          topicTitle: input.context.topicTitle,
          sectionTitle: input.context.sectionTitle,
          restricted: input.context.restricted,
        },
        exercise: input.exercise,
        message: input.message,
        sources: restricted
          ? []
          : input.sources.map((s) => ({
              id: s.id,
              title: s.title,
              sectionTitle: s.sectionTitle,
              text: s.text,
            })),
      });
      if (Buffer.byteLength(data, "utf8") > 24000)
        throw new TutorProviderError("invalid_response");
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
          { role: "user", content: data },
        ],
        text: {
          format: {
            type: "json_schema",
            name: restricted ? "tutor_guided" : "tutor_teaching",
            strict: true,
            schema,
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
      const text = result.output
        .filter((o) => o.type === "message")
        .flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text")
        .map((c) => c.text ?? "")
        .join("");
      try {
        return (
          restricted ? guidedResponseSchema : teachingResponseSchema
        ).parse(JSON.parse(text));
      } catch {
        throw new TutorProviderError("invalid_response");
      }
    },
  };
}

export function getTutorProvider(): TutorProvider | null {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.TUTOR_MODEL?.trim();
  const embeddingModel = env.TUTOR_EMBEDDING_MODEL?.trim();
  if (
    !apiKey ||
    !model ||
    !embeddingModel ||
    (env.TUTOR_PROVIDER && env.TUTOR_PROVIDER !== "openai")
  )
    return null;
  return createOpenAiTutorProvider({ apiKey, model, embeddingModel });
}
