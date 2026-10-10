import { db } from "../db";
import { chunkLesson, rankCourseChunks } from "./chunks";
import type { RetrievedChunk, TutorProvider } from "./types";

export async function retrieveCourseContext(
  input: {
    topicId: string;
    sectionIndex?: number;
    query: string;
  },
  provider: TutorProvider,
): Promise<RetrievedChunk[]> {
  const topic = await db.topic.findUnique({
    where: { id: input.topicId },
    select: { module: { select: { subjectId: true } } },
  });
  if (!topic) return [];
  const subjectId = topic.module.subjectId;
  const include = {
    topic: {
      select: {
        id: true,
        title: true,
        moduleId: true,
        content: true,
        module: { select: { subjectId: true } },
      },
    },
  };
  const [local, related] = await Promise.all([
    db.lectureChunk.findMany({
      where: { topicId: input.topicId, subjectId },
      include,
      orderBy: [{ sectionIndex: "asc" }, { id: "asc" }],
      take: 64,
    }),
    db.lectureChunk.findMany({
      where: { subjectId, topicId: { not: input.topicId } },
      include,
      orderBy: [{ topicId: "asc" }, { sectionIndex: "asc" }, { id: "asc" }],
      take: 192,
    }),
  ]);
  const current = new Map<string, Map<string, string>>();
  const chunks = [...local, ...related].filter((chunk) => {
    if (!current.has(chunk.topicId))
      current.set(
        chunk.topicId,
        new Map(
          chunkLesson({
            ...chunk.topic,
            subjectId: chunk.topic.module.subjectId,
          }).map((c) => [c.id, c.contentHash]),
        ),
      );
    // A content publication cannot silently keep an old vector/citation valid.
    return current.get(chunk.topicId)?.get(chunk.id) === chunk.contentHash;
  });
  let queryEmbedding: number[] | undefined;
  if (
    chunks.some(
      (c) => c.embeddingModel === provider.embeddingModel && c.embedding.length,
    )
  ) {
    try {
      [queryEmbedding] = await provider.embedText([
        Array.from(input.query).slice(0, 2000).join(""),
      ]);
    } catch {
      /* Provider unavailable: use explicitly marked bounded lexical retrieval. */
    }
  }
  return rankCourseChunks(chunks, {
    ...input,
    subjectId,
    embeddingModel: provider.embeddingModel,
    queryEmbedding,
  });
}
