import { loadContent } from "../src/lib/content-source";
import curriculum from "../content/curriculum.json";

async function main() {
  const { lessons, questions, subjects } = await loadContent();
  const levels = ["EASY", "MEDIUM", "HARD", "CHALLENGE"];
  const count = (items: typeof questions) =>
    Object.fromEntries(
      levels.map((level) => [
        level,
        items.filter((q) => q.difficulty === level).length,
      ]),
    );
  const bySubject = subjects.map((subject) => {
    const topics = lessons
      .filter((lesson) => lesson.metadata.subject === subject.id)
      .map((lesson) => lesson.metadata.id);
    const bank = questions.filter((question) =>
      topics.includes(question.topicId),
    );
    return { subject: subject.id, questions: bank.length, ...count(bank) };
  });
  const byTopic = lessons.map((lesson) => {
    const bank = questions.filter((q) => q.topicId === lesson.metadata.id);
    return { topic: lesson.metadata.id, total: bank.length, ...count(bank) };
  });
  const numericTemplates = new Map<string, string[]>();
  for (const question of questions) {
    const key =
      question.topicId +
      ":" +
      question.prompt
        .toLowerCase()
        .replace(/\d+(?:[.,]\d+)?/g, "#")
        .replace(/\s+/g, " ");
    numericTemplates.set(key, [
      ...(numericTemplates.get(key) ?? []),
      question.id,
    ]);
  }
  console.log(
    JSON.stringify(
      {
        lessons: lessons.length,
        total: questions.length,
        levels: count(questions),
        bySubject,
        byTopic,
        fewerThan15: byTopic
          .filter((topic) => topic.total < 15)
          .map((topic) => topic.topic),
        explanations: questions.filter((q) => q.solution.length >= 35).length,
        progressiveHints: questions.filter((q) => q.hints.length === 3).length,
        potentialNumericVariants: [...numericTemplates.values()].filter(
          (ids) => ids.length > 1,
        ),
        curriculum: {
          confirmed: curriculum.confirmed.length,
          existingCompatible: curriculum.existingCompatible,
          future: curriculum.future,
        },
      },
      null,
      2,
    ),
  );
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
