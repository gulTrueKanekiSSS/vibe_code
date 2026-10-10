import { createHash } from "node:crypto";
import type { RetrievedChunk } from "./types";
import { TUTOR_LIMITS } from "./policy";

export type LessonDocument = {
  id: string;
  title: string;
  moduleId: string;
  subjectId: string;
  content: unknown;
};
export type CourseChunk = {
  id: string;
  topicId: string;
  subjectId: string;
  moduleId: string;
  lessonId: string;
  title: string;
  sectionTitle: string;
  sectionIndex: number;
  text: string;
  contentHash: string;
  page: null;
};
export type RankedChunk = Omit<CourseChunk, "page"> & {
  page: number | null;
  embedding: number[];
  embeddingModel: string;
};
const hash = (text: string) => createHash("sha256").update(text).digest("hex");

// Index only published lesson sections, never quizAnswer or Question grading data.
export function chunkLesson(document: LessonDocument): CourseChunk[] {
  const content = document.content as { sections?: unknown } | null;
  if (!Array.isArray(content?.sections)) return [];
  return content.sections.flatMap((value: unknown, sectionIndex: number) => {
    if (!value || typeof value !== "object") return [];
    const section = value as { title?: unknown; text?: unknown };
    if (typeof section.title !== "string" || typeof section.text !== "string")
      return [];
    const chars = Array.from(section.text.trim());
    const chunks: CourseChunk[] = [];
    // Unicode-safe windows, <= 6400 UTF-8 bytes. Prefer paragraph/word boundaries.
    let start = 0;
    while (start < chars.length) {
      let end = Math.min(start + 1600, chars.length);
      if (end < chars.length) {
        const boundary = chars
          .slice(start + 1000, end)
          .join("")
          .search(/\s\S*$/u);
        if (boundary >= 0)
          end =
            start +
            1000 +
            Array.from(
              chars
                .slice(start + 1000, end)
                .join("")
                .slice(0, boundary),
            ).length +
            1;
      }
      const text = chars.slice(start, end).join("").trim();
      const data = {
        topicId: document.id,
        subjectId: document.subjectId,
        moduleId: document.moduleId,
        lessonId: document.id,
        title: document.title,
        sectionTitle: section.title,
        sectionIndex,
        text,
        page: null,
      };
      if (text)
        chunks.push({
          ...data,
          id: `lesson-${hash(`${document.id}:${sectionIndex}:${chunks.length}`).slice(0, 40)}`,
          contentHash: hash(JSON.stringify(data)),
        });
      start = end;
    }
    return chunks;
  });
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (
    !a.length ||
    a.length !== b.length ||
    a.some((n) => !Number.isFinite(n)) ||
    b.some((n) => !Number.isFinite(n))
  )
    return -1;
  const dot = a.reduce((sum, n, i) => sum + n * b[i], 0);
  const norm = Math.sqrt(
    a.reduce((s, n) => s + n * n, 0) * b.reduce((s, n) => s + n * n, 0),
  );
  return norm > 0 && Number.isFinite(norm) ? dot / norm : -1;
}
const tokens = (value: string) =>
  new Set(value.toLocaleLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []);

export function rankCourseChunks(
  chunks: RankedChunk[],
  input: {
    topicId: string;
    subjectId: string;
    sectionIndex?: number;
    query: string;
    embeddingModel: string;
    queryEmbedding?: number[];
  },
): RetrievedChunk[] {
  const words = tokens(input.query);
  const ranked = chunks
    .filter((c) => c.subjectId === input.subjectId)
    .map((chunk) => {
      const vocabulary = tokens(
        `${chunk.title} ${chunk.sectionTitle} ${chunk.text}`,
      );
      const lexical =
        [...words].filter((word) => vocabulary.has(word)).length /
        Math.max(1, words.size);
      const semantic =
        chunk.embeddingModel === input.embeddingModel && input.queryEmbedding
          ? cosineSimilarity(chunk.embedding, input.queryEmbedding)
          : -1;
      const sameTopic = chunk.topicId === input.topicId;
      const sameSection =
        sameTopic && input.sectionIndex === chunk.sectionIndex;
      return {
        chunk,
        score:
          (sameSection ? 4 : sameTopic ? 2 : 0) +
          Math.max(0, semantic) +
          lexical,
        relevant: sameTopic || semantic >= 0.25 || lexical > 0,
        retrieval: semantic >= 0 ? ("semantic" as const) : ("lexical" as const),
      };
    })
    .filter((r) => r.relevant)
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));
  const result: RetrievedChunk[] = [];
  let bytes = 0;
  for (const { chunk, retrieval } of ranked) {
    const size = Buffer.byteLength(chunk.text, "utf8");
    if (bytes + size > TUTOR_LIMITS.sourceBytes) continue;
    bytes += size;
    result.push({
      id: chunk.id,
      topicId: chunk.topicId,
      title: chunk.title,
      sectionTitle: chunk.sectionTitle,
      sectionIndex: chunk.sectionIndex,
      page: chunk.page,
      text: chunk.text,
      retrieval,
      url: `/topics/${encodeURIComponent(chunk.topicId)}#section-${chunk.sectionIndex}`,
    });
    if (result.length === 4) break;
  }
  return result;
}
