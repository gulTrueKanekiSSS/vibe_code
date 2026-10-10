import Link from "next/link";
import { Trophy } from "lucide-react";
import { RichText } from "./markdown";
import { RepeatPractice } from "./repeat-practice";
import { TutorPanel } from "./tutor-panel";
import type { StoredPracticeConfig } from "@/lib/practice-service";

type SummaryItem = {
  id: string;
  topicId: string;
  topicTitle: string;
  difficulty: string;
  prompt: string;
  correct: boolean;
  completed: boolean;
  xp: number;
  attempts: { answer: unknown; correct: boolean; feedback: string | null }[];
  expectedAnswer: unknown;
  solution: string;
};
const labels: Record<string, string> = {
  EASY: "Базовый",
  MEDIUM: "Средний",
  HARD: "Сложный",
  CHALLENGE: "Вызов",
};
function showAnswer(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(" · ");
  return typeof value === "string" ? value : "—";
}
export function PracticeSummary({
  sessionId,
  mode,
  items,
  config,
  overallAfter,
}: {
  sessionId: string;
  mode: string;
  items: SummaryItem[];
  config: StoredPracticeConfig | null;
  overallAfter: number | null;
}) {
  const completed = items.filter((item) => item.completed);
  const early = completed.length < items.length;
  const correct = completed.filter((item) => item.correct).length;
  const topicNames = [...new Set(items.map((item) => item.topicTitle))];
  const mistakes = items.flatMap((item) => {
    const attempts = item.attempts.length
      ? item.attempts
      : item.correct || !item.completed
        ? []
        : [{ answer: null, correct: false, feedback: null }];
    return attempts
      .filter((attempt) => !attempt.correct)
      .map((attempt) => ({
        ...item,
        submittedAnswer: attempt.answer,
        mistakeFeedback: attempt.feedback,
      }));
  });
  const xp = items.reduce((sum, item) => sum + item.xp, 0);
  const editUrl = `/practice/custom?edit=${encodeURIComponent(sessionId)}`;
  return (
    <div className="practice-summary">
      <section className="card session-complete">
        <div className="completion-icon">
          <Trophy size={34} />
        </div>
        <span className="eyebrow">ЕЩЁ ОДИН ШАГ ВПЕРЁД</span>
        <h1>
          {early
            ? "Сессия завершена досрочно"
            : mode === "exam"
              ? "Результат экзамена"
              : "Практика завершена"}
        </h1>
        <p>
          Решено верно {correct} из {completed.length} завершённых заданий.
        </p>
        {early && (
          <p className="muted">
            Не завершено: {items.length - completed.length}. Эти задания не
            засчитаны как выполненные или неверные; новые ответы в этой сессии
            больше не принимаются.
          </p>
        )}
        <p className="muted">
          {topicNames.length <= 3
            ? `Темы: ${topicNames.join(", ")}`
            : `Темы: ${topicNames.slice(0, 3).join(", ")} и ещё ${topicNames.length - 3}`}
        </p>
        <div className="completion-xp">
          +{xp} <small>XP</small>
        </div>
        <p className="muted">
          {completed.length === 0
            ? "Нет завершённых заданий — XP, mastery и Practice GPA не изменены."
            : config?.overallBefore !== null &&
                config?.overallBefore !== undefined &&
                overallAfter !== null
              ? `Общее mastery: ${config.overallBefore} → ${overallAfter}.`
              : "Прогресс и Practice GPA обновлены."}
        </p>
        <div className="button-row">
          <Link
            className="button secondary"
            href="/practice#unfinished-sessions"
          >
            К практике и незавершённым сессиям
          </Link>
          {config && <RepeatPractice sessionId={sessionId} />}
          <Link className="button secondary" href={editUrl}>
            Изменить настройки
          </Link>
          {config && (
            <Link className="button secondary" href={`${editUrl}&harder=1`}>
              Повысить сложность
            </Link>
          )}
          {mistakes.length > 0 && (
            <a className="button secondary" href="#mistake-review">
              Разобрать ошибки
            </a>
          )}
          <Link className="button secondary" href="/progress">
            Посмотреть прогресс
          </Link>
        </div>
      </section>
      <section className="card practice-summary-details">
        <h2>По уровню сложности</h2>
        {(["EASY", "MEDIUM", "HARD", "CHALLENGE"] as const).map((level) => {
          const group = completed.filter((item) => item.difficulty === level);
          return group.length ? (
            <div className="spread" key={level}>
              <span>{labels[level]}</span>
              <strong>
                {group.filter((item) => item.correct).length} / {group.length}
              </strong>
            </div>
          ) : null;
        })}
      </section>
      <section className="card practice-summary-details" id="mistake-review">
        <h2>Разбор ошибок</h2>
        {mistakes.length === 0 ? (
          <p className="muted">
            {completed.length === 0
              ? "Нет ответов для разбора."
              : "Ошибок в отправленных ответах нет."}
          </p>
        ) : (
          mistakes.map((item, index) => (
            <article key={`${item.id}-${index}`} className="mistake-item">
              <h3>
                Ошибка {index + 1} · {item.topicTitle}
              </h3>
              <RichText>{item.prompt}</RichText>
              <p>
                <strong>Твой ответ:</strong> {showAnswer(item.submittedAnswer)}
              </p>
              <p>
                <strong>Верный ответ:</strong> {showAnswer(item.expectedAnswer)}
              </p>
              {item.mistakeFeedback && (
                <RichText>{item.mistakeFeedback}</RichText>
              )}
              <RichText>{item.solution}</RichText>
              <TutorPanel
                topicId={item.topicId}
                practiceItemId={item.id}
                label="Разобрать ошибку с Tutor"
              />
              <Link className="text-link" href={`/topics/${item.topicId}`}>
                Повторить теорию: {item.topicTitle}
              </Link>
              <Link
                className="text-link"
                href={`/practice?topic=${encodeURIComponent(item.topicId)}#custom-practice`}
              >
                Практиковать похожее по теме
              </Link>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
