import { boundedHistory, TUTOR_INSTRUCTIONS } from "./policy";
import {
  TutorProviderError,
  requestProviderJson,
  tutorInputData,
  tutorOutputSchema,
  parseTutorOutput,
} from "./provider-common";
import { reserveGroqRequest, type GroqBudget } from "./groq-budget";
import type { TutorProvider } from "./types";

type Config = { apiKey: string; model: string; budget: GroqBudget };

export function createGroqTutorProvider(
  config: Config,
  fetcher: typeof fetch = fetch,
  timeoutMs = 25000,
  reserve: typeof reserveGroqRequest = reserveGroqRequest,
): TutorProvider {
  return {
    // No matching vectors and no embedding endpoint: retrieval stays lexical.
    embeddingModel: "",
    async embedText() {
      throw new TutorProviderError("unavailable");
    },
    async generateTutorResponse(input) {
      const restricted = input.context.restricted;
      const payload = {
        model: config.model,
        stream: false,
        max_completion_tokens: restricted ? 150 : 1200,
        reasoning_effort: "low",
        reasoning_format: "hidden",
        messages: [
          { role: "system", content: TUTOR_INSTRUCTIONS },
          ...boundedHistory(input.history),
          { role: "user", content: tutorInputData(input) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: restricted ? "tutor_guided" : "tutor_teaching",
            strict: true,
            schema: tutorOutputSchema(restricted),
          },
        },
      };
      await reserve(config.budget);
      const result = (await requestProviderJson(
        "https://api.groq.com/openai/v1/chat/completions",
        { Authorization: `Bearer ${config.apiKey}` },
        payload,
        fetcher,
        timeoutMs,
        true,
      )) as {
        choices?: {
          finish_reason?: string;
          message?: { role?: string; content?: string; refusal?: unknown };
        }[];
      };
      const choice = result?.choices?.[0];
      if (
        !Array.isArray(result?.choices) ||
        result.choices.length !== 1 ||
        choice?.finish_reason !== "stop" ||
        choice.message?.role !== "assistant" ||
        choice.message.refusal ||
        typeof choice.message.content !== "string"
      )
        throw new TutorProviderError("invalid_response");
      return parseTutorOutput(choice.message.content, restricted);
    },
  };
}
