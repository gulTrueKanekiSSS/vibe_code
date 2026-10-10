import { db } from "../db";
import { chunkLesson } from "./chunks";
import type { TutorProvider } from "./types";

export async function indexCourseContent(
  options: { topicId?: string; provider?: TutorProvider } = {},
) {
  const topics = await db.topic.findMany({
    where: options.topicId ? { id: options.topicId } : {},
    select: {
      id: true,
      title: true,
      moduleId: true,
      content: true,
      module: { select: { subjectId: true } },
    },
    orderBy: { id: "asc" },
  });
  if (options.topicId && !topics.length)
    throw new Error("Тема для индексации не найдена.");
  let count = 0,
    embedded = 0;
  for (const topic of topics) {
    const chunks = chunkLesson({ ...topic, subjectId: topic.module.subjectId });
    const previous = new Map(
      (await db.lectureChunk.findMany({ where: { topicId: topic.id } })).map(
        (c) => [c.id, c],
      ),
    );
    const records = chunks.map((chunk) => {
      const old = previous.get(chunk.id);
      const valid = old?.contentHash === chunk.contentHash;
      return {
        ...chunk,
        embedding: valid ? old.embedding : [],
        embeddingModel: valid ? old.embeddingModel : "",
      };
    });
    const provider = options.provider;
    if (provider) {
      const missing = records.filter(
        (c) =>
          !c.embedding.length || c.embeddingModel !== provider.embeddingModel,
      );
      for (let offset = 0; offset < missing.length; offset += 16) {
        const batch = missing.slice(offset, offset + 16);
        const vectors = await provider.embedText(batch.map((c) => c.text));
        if (
          vectors.length !== batch.length ||
          vectors.some(
            (v) =>
              !v.length ||
              v.length > 4096 ||
              v.some((n) => !Number.isFinite(n)),
          )
        )
          throw new Error("Некорректные embeddings: индекс темы не изменён.");
        batch.forEach((chunk, i) => {
          chunk.embedding = vectors[i];
          chunk.embeddingModel = provider.embeddingModel;
        });
        embedded += batch.length;
      }
    }
    await db.$transaction(async (tx) => {
      // Serialize indexers per topic; no provider work happens inside a transaction.
      await tx.$queryRaw`SELECT id FROM "Topic" WHERE id = ${topic.id} FOR UPDATE`;
      const latest = await tx.topic.findUniqueOrThrow({
        where: { id: topic.id },
        include: { module: true },
      });
      const latestChunks = chunkLesson({
        ...latest,
        subjectId: latest.module.subjectId,
      });
      if (JSON.stringify(latestChunks) !== JSON.stringify(chunks))
        throw new Error(
          "Материалы изменились во время индексации; повторите команду.",
        );
      for (const record of records) {
        const concurrent = await tx.lectureChunk.findUnique({
          where: { id: record.id },
        });
        // A lexical-only index run must not discard a concurrently computed matching vector.
        if (!provider && concurrent?.contentHash === record.contentHash) {
          record.embedding = concurrent.embedding;
          record.embeddingModel = concurrent.embeddingModel;
        }
        await tx.lectureChunk.upsert({
          where: { id: record.id },
          create: record,
          update: record,
        });
      }
      await tx.lectureChunk.deleteMany({
        where: { topicId: topic.id, id: { notIn: records.map((c) => c.id) } },
      });
    });
    count += records.length;
  }
  return { topics: topics.length, chunks: count, embeddingsCreated: embedded };
}
