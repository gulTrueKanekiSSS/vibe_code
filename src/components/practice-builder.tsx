"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { StoredPracticeConfig } from "@/lib/practice-service";
import patterns from "../../content/practice-patterns.json";
import { curriculumLabel } from "@/lib/curriculum";
import { FilterSelectAll } from "./filter-select-all";
import { setFilterSelection } from "@/lib/filter-selection";
import { matchesTopicSearch } from "@/lib/practice-topic-search";

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
    description: "Базовый уровень · 5 заданий",
    difficulties: ["EASY"],
    count: 5,
    hintsAllowed: true,
    feedbackMode: "immediate",
  },
  {
    title: "Обычная",
    description: "Базовый + средний · 10 заданий",
    difficulties: ["EASY", "MEDIUM"],
    count: 10,
    hintsAllowed: true,
    feedbackMode: "immediate",
  },
  {
    title: "К семинару",
    description: "Средний + сложный · 10 заданий",
    difficulties: ["MEDIUM", "HARD"],
    count: 10,
    hintsAllowed: true,
    feedbackMode: "immediate",
  },
  {
    title: "К экзамену",
    description: "Сложный + вызов · 15 заданий",
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
  const [topicQuery, setTopicQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(initialConfig));
  const advancedId = useId();
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
  const foundTopics = visibleTopics.filter((topic) =>
    matchesTopicSearch(
      topic,
      subjects.find((subject) => subject.id === topic.subjectId)?.title ?? "",
      topicQuery,
    ),
  );
  const foundTopicIds = foundTopics
    .filter((topic) => topic.questions.length > 0)
    .map((topic) => topic.id);
  const explicitTopics = visibleTopics.filter((topic) =>
    topicIds.includes(topic.id),
  );
  const selectedTypes = visibleTypes.filter((type) =>
    questionTypes.includes(type),
  );
  const selectedPatterns = patterns.filter((pattern) =>
    patternIds.includes(pattern.id),
  );
  const unavailablePatterns = selectedPatterns.filter(
    (pattern) => !visiblePatterns.includes(pattern),
  );
  const subjectTitle =
    subjects.find((subject) => subject.id === subjectId)?.title ??
    "Все предметы";
  const topicScope = !topicIds.length
    ? `Все темы${subjectId ? " предмета" : ""} (${visibleTopics.length})`
    : explicitTopics.length === 1
      ? explicitTopics[0].title
      : `Выбрано тем: ${explicitTopics.length}`;
  const typesSummary =
    selectedTypes.length === visibleTypes.length && visibleTypes.length > 0
      ? "Все доступные типы"
      : selectedTypes.length
        ? selectedTypes.map((type) => typeNames[type] ?? type).join(", ")
        : "Типы не выбраны";

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
        Начни с готовой настройки или выбери всё самостоятельно. Темы и уровни
        можно сочетать — перед стартом увидишь, что войдёт в подборку.
      </p>
      <div className="practice-builder-layout">
        <div className="practice-builder-controls">
          <div
            className="practice-builder-presets"
            aria-label="Готовые настройки практики"
          >
            {presets.map((preset, index) => (
              <button
                key={preset.title}
                type="button"
                className="practice-builder-preset"
                aria-label={preset.title}
                aria-describedby={`${advancedId}-preset-${index} ${advancedId}-preset-help-${index}`}
                aria-pressed={
                  difficulties.length === preset.difficulties.length &&
                  preset.difficulties.every((level) =>
                    difficulties.includes(level),
                  ) &&
                  count === preset.count &&
                  hintsAllowed === preset.hintsAllowed &&
                  feedbackMode === preset.feedbackMode
                }
                disabled={busy}
                onClick={() => {
                  setDifficulties([...preset.difficulties]);
                  setCount(preset.count);
                  setHintsAllowed(preset.hintsAllowed);
                  setFeedbackMode(preset.feedbackMode);
                }}
              >
                <strong>{preset.title}</strong>
                <span id={`${advancedId}-preset-${index}`}>
                  {preset.description}
                </span>
                <small id={`${advancedId}-preset-help-${index}`}>
                  {preset.hintsAllowed ? "С подсказками" : "Без подсказок"} ·{" "}
                  {preset.feedbackMode === "immediate"
                    ? "разбор сразу"
                    : "разбор в конце"}
                </small>
              </button>
            ))}
          </div>
          <div className="practice-builder-section">
            <h3>Что будем практиковать?</h3>
            <label className="practice-builder-field">
              Предмет
              <select
                aria-label="Предмет"
                value={subjectId}
                disabled={busy}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setTopicIds([]);
                  setPatternIds([]);
                  setTopicQuery("");
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
            <fieldset className="practice-builder-fieldset" disabled={busy}>
              <legend>Темы</legend>
              <p className="practice-builder-scope" aria-live="polite">
                {topicScope}.{" "}
                {topicIds.length
                  ? "Добавляй темы из списка или убирай выбранные ниже."
                  : "Чтобы сузить подборку, отметь нужные темы."}
              </p>
              <div
                className="practice-builder-selected"
                role="group"
                aria-label="Выбранные темы"
              >
                {explicitTopics.map((topic) => (
                  <button
                    type="button"
                    key={topic.id}
                    disabled={busy}
                    aria-label={`Убрать тему: ${topic.title}`}
                    onClick={() =>
                      setTopicIds((current) =>
                        setFilterSelection(current, [topic.id], false),
                      )
                    }
                  >
                    {topic.title} <X size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="text-link practice-builder-all-topics"
                disabled={busy}
                aria-pressed={!topicIds.length}
                onClick={() => setTopicIds([])}
              >
                {subjectId ? "Все темы предмета" : "Все темы"}
              </button>
              <label className="practice-builder-field practice-builder-search">
                Поиск тем
                <span>
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Найти тему"
                    value={topicQuery}
                    disabled={busy}
                    placeholder="Название темы или предмета…"
                    onChange={(event) => setTopicQuery(event.target.value)}
                  />
                </span>
              </label>
              {topicQuery.trim() && (
                <div className="practice-builder-search-info">
                  <small className="muted">
                    Найдено тем: {foundTopics.length}. Поиск не меняет выбранные
                    темы.
                  </small>
                  <button
                    type="button"
                    className="text-link"
                    disabled={busy}
                    onClick={() => setTopicQuery("")}
                  >
                    Очистить поиск
                  </button>
                </div>
              )}
              <FilterSelectAll
                label="Выбрать все темы"
                description="Все темы с заданиями выбранного предмета (или всех предметов), независимо от поиска. Пустой выбор означает все темы."
                selected={topicIds}
                available={selectableTopicIds}
                limit={100}
                onChange={(checked) =>
                  setTopicIds((current) =>
                    setFilterSelection(
                      current,
                      selectableTopicIds,
                      checked,
                      100,
                    ),
                  )
                }
              />
              {topicQuery.trim() && (
                <FilterSelectAll
                  label="Выбрать найденные темы"
                  description="Только результаты поиска; выбранные темы вне поиска сохранятся."
                  selected={topicIds}
                  available={foundTopicIds}
                  limit={100}
                  onChange={(checked) =>
                    setTopicIds((current) =>
                      setFilterSelection(current, foundTopicIds, checked, 100),
                    )
                  }
                />
              )}
              <div className="practice-builder-topics">
                {subjects.map((subject) => {
                  const group = foundTopics.filter(
                    (topic) => topic.subjectId === subject.id,
                  );
                  if (!group.length) return null;
                  return (
                    <div
                      className="practice-builder-topic-group"
                      role="group"
                      aria-label={subject.title}
                      key={subject.id}
                    >
                      {!subjectId && (
                        <h4>
                          {subject.title}{" "}
                          <span className="muted">· {group.length}</span>
                        </h4>
                      )}
                      {group.map((topic) => (
                        <label key={topic.id}>
                          <input
                            type="checkbox"
                            checked={topicIds.includes(topic.id)}
                            disabled={
                              !topic.questions.length ||
                              (!topicIds.includes(topic.id) &&
                                topicIds.length >= 100)
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
                          <span>
                            <strong>{topic.title}</strong>
                            <small className="muted">
                              {topic.questions.length
                                ? `${topic.questions.length} в банке`
                                : "Заданий пока нет"}{" "}
                              · {curriculumLabel(topic.id)}
                            </small>
                          </span>
                        </label>
                      ))}
                    </div>
                  );
                })}
                {!foundTopics.length && (
                  <p className="muted practice-builder-empty">
                    {topicQuery.trim()
                      ? "Тем не найдено. Попробуй другое название или очисти поиск — твой выбор сохранён."
                      : "В этом предмете пока нет тем."}
                  </p>
                )}
              </div>
            </fieldset>
          </div>
          <div className="practice-builder-section">
            <h3>Уровень и объём</h3>
            <fieldset className="practice-builder-fieldset" disabled={busy}>
              <legend>Сложность</legend>
              <div className="practice-builder-options">
                {levels.map(([value, title]) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      checked={difficulties.includes(value)}
                      onChange={(event) =>
                        setDifficulties((current) =>
                          setFilterSelection(
                            current,
                            [value],
                            event.target.checked,
                          ),
                        )
                      }
                    />
                    {title}
                  </label>
                ))}
              </div>
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
            </fieldset>
            <div className="practice-builder-count">
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
                      Math.max(
                        1,
                        Math.min(20, Number(event.target.value) || 1),
                      ),
                    )
                  }
                />
              </label>
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
            </div>
          </div>
          <div className="practice-builder-advanced">
            <button
              type="button"
              className="practice-builder-advanced-toggle"
              aria-label="Дополнительные настройки"
              aria-expanded={advancedOpen}
              aria-controls={advancedId}
              disabled={busy}
              onClick={() => setAdvancedOpen(!advancedOpen)}
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span>
                <strong>Дополнительные настройки</strong>
                <small>Категории, типы заданий, подсказки и разбор</small>
              </span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            <div id={advancedId} hidden={!advancedOpen}>
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
                          !patternIds.includes(pattern.id) &&
                          patternIds.length >= 30
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
                    disabled={busy}
                    onClick={() => setPatternIds([])}
                  >
                    Все категории
                  </button>
                )}
                {unavailablePatterns.length > 0 && (
                  <div className="practice-builder-selected">
                    <p className="muted">
                      Эти выбранные категории не встречаются в текущих темах. Их
                      можно убрать:
                    </p>
                    {unavailablePatterns.map((pattern) => (
                      <button
                        key={pattern.id}
                        type="button"
                        disabled={busy}
                        aria-label={`Убрать категорию: ${pattern.title}`}
                        onClick={() =>
                          setPatternIds((current) =>
                            setFilterSelection(current, [pattern.id], false),
                          )
                        }
                      >
                        {pattern.title} <X size={13} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
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
                            setFilterSelection(
                              current,
                              [type],
                              event.target.checked,
                            ),
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
            </div>
          </div>
        </div>
        <aside className="practice-builder-summary" aria-label="Твоя практика">
          <span className="eyebrow">ТВОЯ ПРАКТИКА</span>
          <h3>{count} заданий</h3>
          <dl>
            <div>
              <dt>Предмет</dt>
              <dd>{subjectTitle}</dd>
            </div>
            <div>
              <dt>Темы</dt>
              <dd>{topicScope}</dd>
            </div>
            <div>
              <dt>Сложность</dt>
              <dd>
                {difficulties.length
                  ? levels
                      .filter(([level]) => difficulties.includes(level))
                      .map(([, title]) => title)
                      .join(" + ")
                  : "Уровни не выбраны"}
              </dd>
            </div>
            <div>
              <dt>Типы</dt>
              <dd>{typesSummary}</dd>
            </div>
            <div>
              <dt>Категории</dt>
              <dd>
                {patternIds.length
                  ? `${patternIds.length}: ${selectedPatterns.map((pattern) => pattern.title).join(", ")}`
                  : "Все категории"}
              </dd>
            </div>
            <div>
              <dt>Помощь</dt>
              <dd>
                {hintsAllowed ? "С подсказками" : "Без подсказок"} ·{" "}
                {feedbackMode === "immediate"
                  ? "разбор после ответа"
                  : "разбор в конце"}
              </dd>
            </div>
          </dl>
          {unavailablePatterns.length > 0 && (
            <p className="error-text">
              Есть категории без заданий в выбранных темах. Проверь
              дополнительные настройки.
            </p>
          )}
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
              disabled={busy}
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
          <small className="muted">
            Подборка сохранится. Можно продолжить после обновления страницы.
          </small>
        </aside>
      </div>
    </section>
  );
}
