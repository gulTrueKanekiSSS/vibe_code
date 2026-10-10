import { db } from "../src/lib/db";
import { indexCourseContent } from "../src/lib/tutor/indexer";
import { getTutorProvider } from "../src/lib/tutor/provider";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--embeddings" && !arg.startsWith("--topic=")))
    throw new Error("Допустимы только --embeddings и --topic=<topicId>.");
  const provider = args.includes("--embeddings")
    ? getTutorProvider()
    : undefined;
  if (provider === null)
    throw new Error(
      "Настройте серверные AI credentials и модели; значения не выводятся.",
    );
  const topicId = args.find((arg) => arg.startsWith("--topic="))?.slice(8);
  if (topicId !== undefined && !/^[a-zA-Z0-9_-]{1,100}$/.test(topicId))
    throw new Error("Некорректный topic ID.");
  console.log(await indexCourseContent({ topicId, provider }));
}
main()
  .catch(() => {
    console.error(
      "Индексация Tutor не завершена. Проверьте аргументы, миграции, БД и (для --embeddings) серверную AI-конфигурацию. Существующий индекс сохранён для незавершённых тем.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
