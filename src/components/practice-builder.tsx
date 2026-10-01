"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { StoredPracticeConfig } from "@/lib/practice-service";
import patterns from "../../content/practice-patterns.json";
import { curriculumLabel } from "@/lib/curriculum";
import { FilterSelectAll } from "./filter-select-all";
import { setFilterSelection } from "@/lib/filter-selection";

const levels = [
  ["EASY", "Базовый"],
  ["MEDIUM", "Средний"],
  ["HARD", "Сложный"],
  ["CHALLENGE", "Вызов"],
] as const;
type Difficulty = (typeof levels)[number][0];
type Topic = {
  id: string;
  title: string;
  subjectId: string;
  questions: { difficulty: string; type: string; tags: string[] }[];
};
const typeNames: Record<string, string> = {
  NUMERIC: "Вычисления",
  SHORT_TEXT: "Краткий ответ",
  MULTIPLE_CHOICE: "Выбор ответа",
  MULTI_SELECT: "Несколько ответов",
  TRUE_FALSE: "Верно / неверно",
  STEPS: "По шагам",
  OUTPUT: "Вывод программы",
  FIX_CODE: "Исправление кода",
  CONCEPTUAL: "Понимание концепции",
};
const presets = [
  {
    title: "Разминка",
    difficulties: ["EASY"],
    count: 5,
    hintsAllowed: true,
    feedbackMode: "immediate",
  },
  {
    title: "Обычная",
    difficulties: ["EASY", "MEDIUM"],
    count: 10,
    hintsAllowed: true,
    feedbackMode: "immediate",
  },
  {
    title: "К семинару",
    difficulties: ["MEDIUM", "HARD"],
    count: 10,
    hintsAllowed: true,
    feedbackMode: "immediate",
  },
  {
    title: "К экзамену",
    difficulties: ["HARD", "CHALLENGE"],
    count: 15,
    hintsAllowed: false,
    feedbackMode: "end",
  },
] as const;

export function PracticeBuilder({
  subjects,
  topics,
  initialSubjectId = "",
  initialTopicId = "",
  initialConfig = null,
}: {
  subjects: { id: string; title: string }[];
  topics: Topic[];
  initialSubjectId?: string;
  initialTopicId?: string;
  initialConfig?: StoredPracticeConfig | null;
}) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(
    initialConfig?.subjectId ?? initialSubjectId,
  );
  const [topicIds, setTopicIds] = useState<string[]>(
    initialConfig?.topicIds ?? (initialTopicId ? [initialTopicId] : []),
  );
  const [difficulties, setDifficulties] = useState<Difficulty[]>(
    initialConfig?.difficulties ?? ["EASY", "MEDIUM", "HARD", "CHALLENGE"],
  );
  const [count, setCount] = useState(initialConfig?.count ?? 5);
  const [patternIds, setPatternIds] = useState<string[]>(
    initialConfig?.patternIds ?? [],
  );
  const [questionTypes, setQuestionTypes] = useState<string[]>(
    initialConfig?.questionTypes?.length
      ? initialConfig.questionTypes
      : [
          ...new Set(
            topics.flatMap((topic) =>
              topic.questions.map((question) => question.type),
            ),
          ),
        ],
  );
  const [hintsAllowed, setHintsAllowed] = useState(
    initialConfig?.hintsAllowed ?? true,
  );
  const [feedbackMode, setFeedbackMode] = useState<"immediate" | "end">(
    initialConfig?.feedbackMode ?? "immediate",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const operation = useRef<{ scope: string; key: string } | null>(null);
  const visibleTopics = useMemo(
    () => topics.filter((topic) => !subjectId || topic.subjectId === subjectId),
    [topics, subjectId],
  );
  const selectedTopics = visibleTopics.filter(
    (topic) => !topicIds.length || topicIds.includes(topic.id),
  );
  const selectableTopicIds = visibleTopics
    .filter((topic) => topic.questions.length > 0)
    .map((topic) => topic.id);
  const visibleTypes = [
    ...new Set(
      selectedTopics.flatMap((topic) =>
        topic.questions.map((question) => question.type),
      ),
    ),
  ];
  const visiblePatterns = patterns.filter(
    (pattern) =>
      (!subjectId || pattern.subjects.includes(subjectId)) &&
      selectedTopics.some((topic) =>
        topic.questions.some((q) => q.tags.includes(pattern.id)),
      ),
  );
  const available = visibleTopics
    .filter((topic) => !topicIds.length || topicIds.includes(topic.id))
    .reduce(
      (sum, topic) =>
        sum +
        topic.questions.filter(
          (question) =>
            difficulties.includes(question.difficulty as Difficulty) &&
            questionTypes.includes(question.type) &&
            (!patternIds.length ||
              patternIds.some((id) => question.tags.includes(id))),
        ).length,
      0,
    );

  async function start() {
    if (
      inFlight.current ||
      !available ||
      available < count ||
      !difficulties.length ||
      !questionTypes.length
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const payload = {
      action: "start",
      mode: "custom",
      subjectId: subjectId || undefined,
      topicIds,
      patternIds,
      difficulties,
      questionTypes: questionTypes.filter((type) =>
        visibleTypes.includes(type),
      ),
      hintsAllowed,
      feedbackMode,
      count,
    };
    try {
      const scope = JSON.stringify(payload);
      if (operation.current?.scope !== scope)
        operation.current = { scope, key: crypto.randomUUID() };
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestKey: operation.current.key }),
      });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Не удалось начать практику.");
      if (typeof data.sessionId !== "string" || !data.sessionId)
        throw new Error("Сессия не была создана. Попробуй ещё раз.");
      router.push(`/practice/${data.sessionId}`);
    } catch (cause) {
      inFlight.current = false;
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Ошибка сети.");
    }
  }

  return (
    <section
      id="custom-practice"
      className="card practice-builder"
      aria-labelledby="practice-builder-title"
    >
      <div className="spread">
        <div>
          <span className="eyebrow">СВОЙ МАРШРУТ</span>
          <h2 id="practice-builder-title">Собрать практику</h2>
        </div>
        <span className="pill">До 20 заданий</span>
      </div>
      <p className="muted">
        Выбери предмет, темы, уровень и тип заданий. Подборка сохранится как
        обычная сессия: её можно продолжить после обновления страницы.
      </p>
      <div
        className="practice-builder-options"
        aria-label="Готовые настройки практики"
      >
        {presets.map((preset) => (
          <button
            key={preset.title}
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => {
              setDifficulties([...preset.difficulties]);
              setCount(preset.count);
              setHintsAllowed(preset.hintsAllowed);
              setFeedbackMode(preset.feedbackMode);
            }}
          >
            {preset.title}
          </button>
        ))}
      </div>
      <div className="practice-builder-grid">
        <label className="practice-builder-field">
          Предмет
          <select
            value={subjectId}
            disabled={busy}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setTopicIds([]);
              setPatternIds([]);
              setQuestionTypes([
                ...new Set(
                  topics
                    .filter(
                      (topic) =>
                        !event.target.value ||
                        topic.subjectId === event.target.value,
                    )
                    .flatMap((topic) =>
                      topic.questions.map((question) => question.type),
                    ),
                ),
              ]);
            }}
          >
            <option value="">Все предметы</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.title}
              </option>
            ))}
          </select>
        </label>
        <label className="practice-builder-field">
          Количество заданий
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            disabled={busy}
            onChange={(event) =>
              setCount(
                Math.max(1, Math.min(20, Number(event.target.value) || 1)),
              )
            }
          />
        </label>
      </div>
      <div
        className="practice-builder-options"
        aria-label="Быстрый выбор количества"
      >
        {[5, 10, 15, 20].map((value) => (
          <button
            key={value}
            className="button secondary"
            type="button"
            disabled={busy}
            aria-pressed={count === value}
            onClick={() => setCount(value)}
          >
            {value} заданий
          </button>
        ))}
      </div>
      <fieldset className="practice-builder-fieldset" disabled={busy}>
        <legend>Сложность</legend>
        <FilterSelectAll
          label="Выбрать все сложности"
          description="Все четыре уровня сложности."
          selected={difficulties}
          available={levels.map(([value]) => value)}
          onChange={(checked) =>
            setDifficulties((current) =>
              setFilterSelection(
                current,
                levels.map(([value]) => value),
                checked,
              ),
            )
          }
        />
        <div className="practice-builder-options">
          {levels.map(([value, title]) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={difficulties.includes(value)}
                onChange={(event) =>
                  setDifficulties((current) =>
                    setFilterSelection(current, [value], event.target.checked),
                  )
                }
              />
              {title}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="practice-builder-fieldset" disabled={busy}>
        <legend>
          Темы <span className="muted">(не выбрано — все темы предмета)</span>
        </legend>
        <small className="muted">
          Список прокручивается; можно выбрать несколько тем.
        </small>
        <FilterSelectAll
          label="Выбрать все темы"
          description="Все темы с заданиями в текущем списке, включая темы ниже в области прокрутки."
          selected={topicIds}
          available={selectableTopicIds}
          limit={100}
          onChange={(checked) =>
            setTopicIds((current) =>
              setFilterSelection(current, selectableTopicIds, checked, 100),
            )
          }
        />
        <div className="practice-builder-topics">
          {visibleTopics.map((topic) => (
            <label key={topic.id}>
              <input
                type="checkbox"
                checked={topicIds.includes(topic.id)}
                disabled={
                  !topic.questions.length ||
                  (!topicIds.includes(topic.id) && topicIds.length >= 100)
                }
                onChange={(event) =>
                  setTopicIds((current) =>
                    setFilterSelection(
                      current,
                      [topic.id],
                      event.target.checked,
                      100,
                    ),
                  )
                }
              />
              {topic.title}{" "}
              <span className="muted">
                · {topic.questions.length} · {curriculumLabel(topic.id)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="practice-builder-fieldset" disabled={busy}>
        <legend>
          Содержание заданий{" "}
          <span className="muted">(не выбрано — все категории)</span>
        </legend>
        <FilterSelectAll
          label="Выбрать все категории"
          description="Все категории, доступные для выбранных тем. Пустой выбор снимает ограничение по категориям."
          selected={patternIds}
          available={visiblePatterns.map((pattern) => pattern.id)}
          limit={30}
          onChange={(checked) =>
            setPatternIds((current) =>
              setFilterSelection(
                current,
                visiblePatterns.map((pattern) => pattern.id),
                checked,
                30,
              ),
            )
          }
        />
        <div className="practice-builder-options">
          {visiblePatterns.map((pattern) => (
            <label key={pattern.id}>
              <input
                type="checkbox"
                checked={patternIds.includes(pattern.id)}
                disabled={
                  !patternIds.includes(pattern.id) && patternIds.length >= 30
                }
                onChange={(event) =>
                  setPatternIds((current) =>
                    setFilterSelection(
                      current,
                      [pattern.id],
                      event.target.checked,
                      30,
                    ),
                  )
                }
              />
              {pattern.title}
            </label>
          ))}
        </div>
        {patternIds.length > 0 && (
          <button
            type="button"
            className="text-link"
            onClick={() => setPatternIds([])}
          >
            Все категории
          </button>
        )}
      </fieldset>
      <fieldset className="practice-builder-fieldset" disabled={busy}>
        <legend>Типы заданий</legend>
        <FilterSelectAll
          label="Выбрать все типы заданий"
          description="Все типы заданий, доступные для выбранных тем."
          selected={questionTypes}
          available={visibleTypes}
          onChange={(checked) =>
            setQuestionTypes((current) =>
              setFilterSelection(current, visibleTypes, checked),
            )
          }
        />
        <div className="practice-builder-options">
          {visibleTypes.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                checked={questionTypes.includes(type)}
                onChange={(event) =>
                  setQuestionTypes((current) =>
                    setFilterSelection(current, [type], event.target.checked),
                  )
                }
              />
              {typeNames[type] ?? type}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="practice-builder-grid practice-builder-preferences">
        <fieldset className="practice-builder-fieldset" disabled={busy}>
          <legend>Подсказки</legend>
          <div className="practice-builder-options">
            <label>
              <input
                type="radio"
                name="builder-hints"
                checked={hintsAllowed}
                onChange={() => setHintsAllowed(true)}
              />
              Разрешены
            </label>
            <label>
              <input
                type="radio"
                name="builder-hints"
                checked={!hintsAllowed}
                onChange={() => setHintsAllowed(false)}
              />
              Отключены
            </label>
          </div>
        </fieldset>
        <fieldset className="practice-builder-fieldset" disabled={busy}>
          <legend>Обратная связь</legend>
          <div className="practice-builder-options">
            <label>
              <input
                type="radio"
                name="builder-feedback"
                checked={feedbackMode === "immediate"}
                onChange={() => setFeedbackMode("immediate")}
              />
              После каждого ответа
            </label>
            <label>
              <input
                type="radio"
                name="builder-feedback"
                checked={feedbackMode === "end"}
                onChange={() => setFeedbackMode("end")}
              />
              В конце сессии
            </label>
          </div>
        </fieldset>
      </div>
      <p role="status" className="muted">
        {!available
          ? "По выбранным условиям заданий пока нет. Измени темы, тип или сложность."
          : available < count
            ? `Доступно только ${available} заданий из выбранных ${count}. Уменьши количество или расширь фильтры.`
            : `Доступно ${available} заданий; в сессию войдёт ${count}.`}
      </p>
      {available > 0 && available < count && (
        <button
          type="button"
          className="button secondary"
          onClick={() => setCount(available)}
        >
          Использовать доступные ({available})
        </button>
      )}
      {available < count && !difficulties.includes("MEDIUM") && (
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => setDifficulties([...difficulties, "MEDIUM"])}
        >
          Добавить средний уровень
        </button>
      )}
      <button
        type="button"
        className="button"
        disabled={
          busy ||
          !available ||
          available < count ||
          !difficulties.length ||
          !questionTypes.length
        }
        aria-busy={busy}
        onClick={start}
      >
        {busy && <LoaderCircle size={16} className="spin" />}
        Начать выбранную практику <ArrowRight size={17} />
      </button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </section>
  );
}
