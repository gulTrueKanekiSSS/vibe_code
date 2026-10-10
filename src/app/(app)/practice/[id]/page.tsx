import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/ui";
import { getProgress } from "@/lib/progress";
import { readPracticeConfig } from "@/lib/practice-service";
import { PracticeSummary } from "@/components/practice-summary";
import { FinishPractice } from "@/components/finish-practice";
import {
  PracticeRunner,
  type PracticeView,
} from "@/components/practice-runner";
export default async function Session({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    user = await requireUser(),
    session = await db.practiceSession.findFirst({
      where: { id, userId: user.id },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: {
            submissions: { orderBy: { createdAt: "asc" } },
            question: {
              include: {
                topic: { include: { module: { include: { subject: true } } } },
              },
            },
          },
        },
      },
    });
  if (!session) notFound();
  const config = readPracticeConfig(session.config);
  if (session.finishedAt) {
    const progress = await getProgress(user.id);
    return (
      <PracticeSummary
        sessionId={session.id}
        mode={session.mode}
        config={config}
        overallAfter={progress.overall}
        items={session.items.map((item) => ({
          id: item.id,
          topicId: item.question.topicId,
          topicTitle: item.question.topic.title,
          difficulty: item.question.difficulty,
          prompt: item.question.prompt,
          correct: item.correct,
          completed: !!item.completedAt,
          xp: item.xp,
          attempts: item.submissions.map((attempt) => ({
            answer: attempt.answer,
            correct: attempt.correct,
            feedback:
              typeof attempt.answer === "string" &&
              item.question.feedback &&
              typeof item.question.feedback === "object" &&
              !Array.isArray(item.question.feedback) &&
              typeof (item.question.feedback as Record<string, unknown>)[
                attempt.answer.trim()
              ] === "string"
                ? (item.question.feedback as Record<string, string>)[
                    attempt.answer.trim()
                  ]
                : null,
          })),
          expectedAnswer: item.question.answer,
          solution: item.question.solution,
        }))}
      />
    );
  }
  const revealExam = session.mode !== "exam" && config?.feedbackMode !== "end";
  const items: PracticeView[] = session.items.map((i) => ({
    id: i.id,
    questionId: i.questionId,
    topicId: i.question.topicId,
    topicTitle: i.question.topic.title,
    subjectTitle: i.question.topic.module.subject.title,
    prompt: i.question.prompt,
    type: i.question.type,
    difficulty: i.question.difficulty,
    options: i.question.options as string[],
    completed: !!i.completedAt,
    correct: revealExam ? i.correct : null,
    xp: revealExam ? i.xp : null,
    attempts: i.attempts,
    hintLevel: i.hintLevel,
    hints: [
      ...i.question.hints,
      ...(i.hintLevel === 4 ? [i.question.solution] : []),
    ].slice(0, i.hintLevel),
    solution: revealExam && i.completedAt ? i.question.solution : null,
  }));
  return (
    <>
      <PageHeading
        eyebrow="ПРАКТИКА"
        title={
          session.mode === "daily"
            ? "Твоя практика на сегодня"
            : session.mode === "exam"
              ? "Проверка знаний"
              : "Закрепляем понимание"
        }
        description="Работай в своём темпе. Правильные ответы и прогресс проверяет сервер."
      />
      <PracticeRunner
        items={items}
        exam={session.mode === "exam"}
        hintsAllowed={config?.hintsAllowed ?? true}
        feedbackAtEnd={config?.feedbackMode === "end"}
      />
      <div className="session-finish-action">
        <FinishPractice sessionId={session.id} />
      </div>
    </>
  );
}
