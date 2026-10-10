"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { RichText } from "./markdown";
import { ProgressBar } from "./ui";
import { TutorPanel } from "./tutor-panel";
export type PracticeView = {
  id: string;
  questionId: string;
  topicId: string;
  topicTitle: string;
  subjectTitle: string;
  prompt: string;
  type: string;
  difficulty: string;
  options: string[];
  completed: boolean;
  correct: boolean | null;
  xp: number | null;
  attempts: number;
  hintLevel: number;
  hints: string[];
  solution: string | null;
};
type Result = {
  correct: boolean | null;
  finished: boolean;
  xp: number | null;
  attempts: number;
  solution: string | null;
  feedback: string | null;
};
const difficulty: Record<string, string> = {
  EASY: "Базовый",
  MEDIUM: "Средний",
  HARD: "Сложный",
  CHALLENGE: "Вызов",
};
export function PracticeRunner({
  items,
  exam,
  hintsAllowed = true,
  feedbackAtEnd = false,
}: {
  items: PracticeView[];
  exam: boolean;
  hintsAllowed?: boolean;
  feedbackAtEnd?: boolean;
}) {
  const [list, setList] = useState(items),
    [index, setIndex] = useState(
      Math.max(
        0,
        items.findIndex((i) => !i.completed),
      ),
    ),
    [answer, setAnswer] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [steps, setSteps] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [feedback, setFeedback] = useState<Result | null>(null),
    [done] = useState(items.every((i) => i.completed));
  const hiddenResults = exam || feedbackAtEnd;
  const item = list[index],
    completed = list.filter((i) => i.completed).length;
  async function call(body: object) {
    const response = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result: Result = await call({
        action: "answer",
        itemId: item.id,
        submissionKey: crypto.randomUUID(),
        answer:
          item.type === "MULTI_SELECT"
            ? selected
            : item.type === "STEPS"
              ? item.options.map((_, i) => steps[i] ?? "")
              : answer,
      });
      setFeedback(hiddenResults ? null : result);
      setList(
        list.map((x, i) =>
          i === index
            ? {
                ...x,
                completed: result.finished,
                correct: result.correct,
                xp: result.xp,
                attempts: result.attempts,
                solution: result.solution,
              }
            : x,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети.");
    } finally {
      setBusy(false);
    }
  }
  async function hint() {
    setBusy(true);
    setError("");
    try {
      const result = await call({ action: "hint", itemId: item.id });
      setList(
        list.map((x, i) =>
          i === index
            ? {
                ...x,
                hintLevel: result.level,
                hints: [...x.hints, result.text],
              }
            : x,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети.");
    } finally {
      setBusy(false);
    }
  }
  function next() {
    if (completed === list.length) {
      window.location.reload();
      return;
    }
    const nextIndex = list.findIndex((x, i) => i > index && !x.completed);
    setIndex(nextIndex >= 0 ? nextIndex : list.findIndex((x) => !x.completed));
    setFeedback(null);
    setAnswer("");
    setSelected([]);
    setSteps([]);
    setError("");
  }
  if (done)
    return (
      <section className="card session-complete">
        <div className="completion-icon">
          <Trophy size={34} />
        </div>
        <span className="eyebrow">ЕЩЁ ОДИН ШАГ ВПЕРЁД</span>
        <h1>{exam ? "Результат экзамена" : "Практика завершена"}</h1>
        <p>
          Решено верно {list.filter((i) => i.correct).length} из {list.length}{" "}
          заданий.
        </p>
        <div className="completion-xp">
          {exam
            ? `${Math.round((list.filter((i) => i.correct).length / list.length) * 100)}%`
            : `+${list.reduce((s, i) => s + (i.xp ?? 0), 0)}`}{" "}
          <small>{exam ? "верных ответов" : "XP"}</small>
        </div>
        <p className="muted">
          Результаты сохранены. Mastery и Practice GPA обновлены.
        </p>
        {exam && (
          <div className="exam-breakdown">
            <h2>Результаты по темам</h2>
            {[...new Set(list.map((i) => i.topicId))].map((id) => {
              const group = list.filter((i) => i.topicId === id);
              return (
                <div className="spread" key={id}>
                  <span>
                    {group[0].topicTitle}
                    <small>{group[0].subjectTitle}</small>
                  </span>
                  <strong>
                    {group.filter((i) => i.correct).length} / {group.length}
                  </strong>
                </div>
              );
            })}
          </div>
        )}
        <div className="button-row">
          <Link className="button" href="/progress">
            Посмотреть прогресс
            <ArrowRight size={17} />
          </Link>
          <Link className="button secondary" href="/practice">
            Ещё практика
            <RotateCcw size={16} />
          </Link>
        </div>
      </section>
    );
  return (
    <div className="practice-runner">
      <div className="spread practice-topline">
        <span>
          Задание {index + 1} из {list.length}
        </span>
        <span>{completed} завершено</span>
      </div>
      <ProgressBar value={(completed / list.length) * 100} />
      <section className="card question-card">
        <div className="spread">
          <span className="pill">{difficulty[item.difficulty]}</span>
          <span className="muted">
            {exam ? "Экзамен · без подсказок" : "Понимание важнее скорости"}
          </span>
        </div>
        <RichText>{item.prompt}</RichText>
        <form onSubmit={submit}>
          <fieldset disabled={busy || item.completed}>
            <legend className="sr-only">Твой ответ</legend>
            {["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTI_SELECT"].includes(
              item.type,
            ) ? (
              <div className="question-options">
                {item.options.map((option, i) => (
                  <label
                    key={option}
                    className={`option ${(item.type === "MULTI_SELECT" ? selected.includes(option) : answer === option) ? "selected" : ""}`}
                  >
                    <input
                      type={item.type === "MULTI_SELECT" ? "checkbox" : "radio"}
                      name="answer"
                      value={option}
                      checked={
                        item.type === "MULTI_SELECT"
                          ? selected.includes(option)
                          : answer === option
                      }
                      onChange={() =>
                        item.type === "MULTI_SELECT"
                          ? setSelected(
                              selected.includes(option)
                                ? selected.filter((s) => s !== option)
                                : [...selected, option],
                            )
                          : setAnswer(option)
                      }
                    />
                    <span className="option-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </label>
                ))}
              </div>
            ) : item.type === "STEPS" ? (
              <div className="step-inputs">
                {item.options.map((label, i) => (
                  <label key={label}>
                    {label}
                    <input
                      required
                      value={steps[i] ?? ""}
                      onChange={(e) => {
                        const copy = [...steps];
                        copy[i] = e.target.value;
                        setSteps(copy);
                      }}
                      placeholder="Ответ шага"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <label className="answer-label">
                {item.type === "FIX_CODE"
                  ? "Исправленный фрагмент"
                  : "Твой ответ"}
                <input
                  autoComplete="off"
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  inputMode={item.type === "NUMERIC" ? "decimal" : "text"}
                  placeholder={
                    item.type === "NUMERIC" ? "Введи число…" : "Введи ответ…"
                  }
                />
              </label>
            )}
            {!item.completed && (
              <button
                disabled={
                  busy ||
                  (["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(item.type) &&
                    !answer) ||
                  (item.type === "MULTI_SELECT" && !selected.length)
                }
                className="button"
              >
                {busy ? "Проверяем…" : "Проверить ответ"}
                <ArrowRight size={17} />
              </button>
            )}
          </fieldset>
        </form>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        {!hiddenResults && feedback && (
          <div
            role="status"
            className={`feedback ${feedback.correct ? "success" : "warning"}`}
          >
            <strong>
              {feedback.correct
                ? `Верно! +${feedback.xp} XP`
                : feedback.finished
                  ? "Разберём решение вместе"
                  : "Пока не совсем. Попробуй ещё раз."}
            </strong>
            {!feedback.finished && (
              <p>Осталось попыток: {3 - feedback.attempts}.</p>
            )}
            {!feedback.correct && feedback.feedback && (
              <RichText>{feedback.feedback}</RichText>
            )}
            {feedback.solution && <RichText>{feedback.solution}</RichText>}
          </div>
        )}
        {hiddenResults && item.completed && (
          <div role="status" className="feedback neutral">
            Ответ принят. Результаты появятся после завершения практики.
          </div>
        )}
        {item.completed && (
          <button onClick={next} className="button">
            {completed === list.length
              ? "Завершить практику"
              : "Следующее задание"}
            <ArrowRight size={17} />
          </button>
        )}
      </section>
      {!exam && hintsAllowed && !item.completed && (
        <section className="card hint-card">
          <div>
            <Lightbulb size={21} />
            <strong>Нужна небольшая подсказка?</strong>
            <span className="muted">
              Она уменьшает награду, но помогает понять.
            </span>
          </div>
          {item.hints.map((h, i) => (
            <div className="hint-content" key={i}>
              <RichText>{h}</RichText>
            </div>
          ))}
          <button
            className="button secondary"
            disabled={busy || item.hintLevel >= 4}
            onClick={hint}
          >
            {
              [
                "Маленькая подсказка · ×0.90",
                "Показать формулу · ×0.80",
                "Объяснить идею · ×0.65",
                "Полное решение · ×0.40",
                "Все подсказки открыты",
              ][item.hintLevel]
            }
          </button>
        </section>
      )}
      <p className="practice-note">
        <CheckCircle2 size={14} />
        Прогресс сохраняется автоматически. За повторно решённый вопрос XP не
        начисляется.
      </p>
      <TutorPanel
        key={item.id}
        topicId={item.topicId}
        practiceItemId={item.id}
        label="Обсудить задание с Tutor"
        disabledReason={
          exam || feedbackAtEnd || !hintsAllowed
            ? "Tutor доступен после завершения практики: сейчас включён экзамен, отложенная проверка или режим без подсказок."
            : undefined
        }
      />
    </div>
  );
}
