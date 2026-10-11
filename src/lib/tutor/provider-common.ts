import { guidedResponseSchema, teachingResponseSchema } from "./policy";
import type { TutorGenerationInput } from "./types";

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

// Only adapters supply fixed URLs; credentials and provider bodies never escape.
export async function requestProviderJson(
  url: string,
  headers: Record<string, string>,
  payload: unknown,
  fetcher: typeof fetch,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
      headers: { ...headers, "Content-Type": "application/json" },
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
    throw new TutorProviderError("invalid_response");
  } finally {
    clearTimeout(timer);
  }
}

export function tutorOutputSchema(restricted: boolean) {
  return restricted
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
}

export function tutorInputData(input: TutorGenerationInput) {
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
    sources: input.context.restricted
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
  return data;
}

export function parseTutorOutput(text: string, restricted: boolean) {
  try {
    return (restricted ? guidedResponseSchema : teachingResponseSchema).parse(
      JSON.parse(text),
    );
  } catch {
    throw new TutorProviderError("invalid_response");
  }
}

export function validateEmbeddingTexts(texts: string[]) {
  if (
    !texts.length ||
    texts.length > 16 ||
    texts.some((t) => !t.trim() || Buffer.byteLength(t, "utf8") > 8000)
  )
    throw new TutorProviderError("invalid_response");
}

export function validateVectors(
  vectors: unknown[],
  expected: number,
): number[][] {
  const dimension = Array.isArray(vectors[0]) ? vectors[0].length : 0;
  if (
    vectors.length !== expected ||
    !dimension ||
    dimension > 4096 ||
    vectors.some(
      (v) =>
        !Array.isArray(v) ||
        v.length !== dimension ||
        v.some((n: unknown) => typeof n !== "number" || !Number.isFinite(n)),
    )
  )
    throw new TutorProviderError("invalid_response");
  return vectors as number[][];
}
