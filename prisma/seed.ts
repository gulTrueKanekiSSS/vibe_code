import { PrismaClient } from "@prisma/client";
import { loadContent, section } from "../src/lib/content-source";

const db = new PrismaClient();
async function main() {
  const { subjects, lessons, questions } = await loadContent();
  for (const [order, subject] of subjects.entries()) {
    const { modules, ...meta } = subject;
    await db.subject.upsert({
      where: { id: subject.id },
      create: { ...meta, order },
      update: { ...meta, order },
    });
    for (const [index, title] of modules.entries())
      await db.module.upsert({
        where: { id: `${subject.id}-${index}` },
        create: {
          id: `${subject.id}-${index}`,
          subjectId: subject.id,
          title,
          order: index,
        },
        update: { title, order: index },
      });
  }
  for (const lesson of lessons) {
    const m = lesson.metadata,
      subject = subjects.find((s) => s.id === m.subject)!;
    const data = {
      title: m.title,
      english: m.english,
      moduleId: `${m.subject}-${subject.modules.indexOf(m.module)}`,
      order: m.order,
      difficulty: m.difficulty,
      estimatedMinutes: m.estimatedMinutes,
      prerequisites: m.prerequisites,
      keywords: m.keywords,
      content: JSON.parse(
        JSON.stringify({ sections: lesson.sections, quizAnswer: m.quizAnswer }),
      ),
    };
    await db.topic.upsert({
      where: { id: m.id },
      create: { id: m.id, ...data },
      update: data,
    });
    const rawFormula = section(lesson, "Формула и её смысл"),
      match = rawFormula?.match(/\$\$\s*([\s\S]*?)\s*\$\$/);
    if (match) {
      const formula = {
        topicId: m.id,
        title: m.title,
        latex: match[1].trim(),
        meaning:
          section(lesson, "Почему формула работает?") ??
          section(lesson, "Что это?") ??
          "",
        variables: rawFormula!.replace(match[0], "").trim(),
        whenToUse:
          section(lesson, "Зачем это нужно?") ??
          section(lesson, "Что это?") ??
          "",
        mistake: section(lesson, "Частая ошибка") ?? "",
        example: section(lesson, "Разберём на примере") ?? "",
      };
      await db.formula.upsert({
        where: { id: `formula-${m.id}` },
        create: { id: `formula-${m.id}`, ...formula },
        update: formula,
      });
    }
  }
  for (const q of questions) {
    const data = { ...q, feedback: q.feedback ?? {} };
    await db.question.upsert({
      where: { id: q.id },
      create: data,
      update: data,
    });
  }
  console.log(
    `Seed: ${subjects.length} subjects, ${lessons.length} topics, ${questions.length} questions.`,
  );
}
main().then(
  () => db.$disconnect(),
  async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exitCode = 1;
  },
);
