"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { StoredPracticeConfig } from "@/lib/practice-service";
import type { Difficulty } from "@/lib/learning";
import patterns from "../../content/practice-patterns.json";
import { curriculumLabel } from "@/lib/curriculum";
import { FilterSelectAll } from "./filter-select-all";
import { setFilterSelection } from "@/lib/filter-selection";
import {
  matchingQuestionCount,
  selectionForSubject,
  suggestBuilderTopics,
  practicePresets,
  practiceGoals,
  type BuilderTopic,
  type PracticeGoal,
} from "@/lib/practice-builder";

const levels = [
  ["EASY", "Базовый"],
  ["MEDIUM", "Средний"],
  ["HARD", "Сложный"],
  ["CHALLENGE", "Вызов"],
] as const;
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

export function PracticeBuilder({
  subjects,
  topics,
  initialSubjectId = "",
  initialTopicId = "",
  initialConfig = null,
  headingLevel = 2,
}: {
  subjects: { id: string; title: string }[];
  topics: BuilderTopic[];
  initialSubjectId?: string;
  initialTopicId?: string;
  initialConfig?: StoredPracticeConfig | null;
  headingLevel?: 1 | 2;
}) {
  const router = useRouter();
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const SummaryHeading = headingLevel === 1 ? "h2" : "h3";
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
      : [...new Set(topics.flatMap((t) => t.questions.map((q) => q.type)))],
  );
  const [hintsAllowed, setHintsAllowed] = useState(
    initialConfig?.hintsAllowed ?? true,
  );
  const [feedbackMode, setFeedbackMode] = useState<"immediate" | "end">(
    initialConfig?.feedbackMode ?? "immediate",
  );
  const [goal, setGoal] = useState<PracticeGoal>(
    initialConfig?.feedbackMode === "end" ? "check" : "reinforce",
  );
  const [moduleId, setModuleId] = useState(
    topics.find((t) => t.id === (initialConfig?.topicIds[0] ?? initialTopicId))
      ?.moduleId ?? "",
  );
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const operation = useRef<{ scope: string; key: string } | null>(null);
  const visibleTopics = topics.filter(
    (t) => !subjectId || t.subjectId === subjectId,
  );
  const selectedTopics = visibleTopics.filter(
    (t) => !topicIds.length || topicIds.includes(t.id),
  );
  const chosenTopics = visibleTopics.filter((t) => topicIds.includes(t.id));
  const modules = [
    ...new Map(
      visibleTopics.map((t) => [
        t.moduleId,
        { id: t.moduleId, title: t.moduleTitle, subjectId: t.subjectId },
      ]),
    ).values(),
  ];
  const activeModule = modules.find((m) => m.id === moduleId) ?? modules[0];
  const listedTopics = visibleTopics.filter(
    (t) =>
      t.moduleId === activeModule?.id &&
      t.title
        .toLocaleLowerCase("ru")
        .includes(search.trim().toLocaleLowerCase("ru")),
  );
  const filters = { difficulties, questionTypes, patternIds };
  const selectableTopicIds = listedTopics
    .filter((t) => matchingQuestionCount(t, filters) > 0)
    .map((t) => t.id);
  const visibleTypes = [
    ...new Set(selectedTopics.flatMap((t) => t.questions.map((q) => q.type))),
  ];
  const visiblePatterns = patterns.filter(
    (p) =>
      (!subjectId || p.subjects.includes(subjectId)) &&
      selectedTopics.some((t) =>
        t.questions.some((q) => q.tags.includes(p.id)),
      ),
  );
  const available = selectedTopics.reduce(
    (sum, t) => sum + matchingQuestionCount(t, filters),
    0,
  );
  const suggestion = suggestBuilderTopics(visibleTopics, filters, count);
  const activePreset = practicePresets.find(
    (p) =>
      p.count === count &&
      p.hintsAllowed === hintsAllowed &&
      p.feedbackMode === feedbackMode &&
      p.difficulties.length === difficulties.length &&
      p.difficulties.every((d) => difficulties.includes(d)),
  );
  const goalTitle = practiceGoals.find((g) => g.id === goal)!.title;
  const subjectTitle =
    subjects.find((s) => s.id === subjectId)?.title ?? "Все предметы";
  const invalid =
    !available ||
    available < count ||
    !difficulties.length ||
    !questionTypes.some((t) => visibleTypes.includes(t));

  function changeTopics(next: string[]) {
    setTopicIds(next);
    setNotice("");
    const scope = visibleTopics.filter(
      (t) => !next.length || next.includes(t.id),
    );
    setPatternIds((current) =>
      current.filter((id) =>
        scope.some((t) => t.questions.some((q) => q.tags.includes(id))),
      ),
    );
  }
  function changeSubject(next: string) {
    const selection = selectionForSubject(topics, next, {
      topicIds,
      patternIds,
      questionTypes,
    });
    setSubjectId(next);
    setTopicIds(selection.topicIds);
    setPatternIds(selection.patternIds);
    setQuestionTypes(selection.questionTypes);
    setModuleId("");
    setSearch("");
    setNotice("");
    setError("");
  }
  function applyPreset(preset: (typeof practicePresets)[number]) {
    setDifficulties([...preset.difficulties]);
    setCount(preset.count);
    setHintsAllowed(preset.hintsAllowed);
    setFeedbackMode(preset.feedbackMode);
    setGoal(preset.goal);
  }
  function applyGoal(next: PracticeGoal) {
    const settings = practiceGoals.find((g) => g.id === next)!;
    if (next === "seminar") applyPreset(practicePresets[2]);
    if (next === "exam") applyPreset(practicePresets[3]);
    setGoal(next);
    setHintsAllowed(settings.hintsAllowed);
    setFeedbackMode(settings.feedbackMode);
  }
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
      className="practice-builder"
      aria-labelledby="practice-builder-title"
    >
      <header className="builder-heading">
        <span className="eyebrow">СВОЙ МАРШРУТ</span>
        <Heading id="practice-builder-title">Собрать практику</Heading>
        <p className="muted">
          Выбери темы и настройки. Сессия сохранится — продолжить можно даже
          после обновления страницы.
        </p>
      </header>
      <div className="builder-presets" aria-label="Готовые настройки практики">
        {practicePresets.map((preset) => (
          <button
            type="button"
            key={preset.title}
            disabled={busy}
            aria-pressed={activePreset === preset}
            onClick={() => applyPreset(preset)}
          >
            {activePreset === preset ? (
              <Check size={16} />
            ) : (
              <Sparkles size={16} />
            )}{" "}
            {preset.title}
          </button>
        ))}
      </div>
      <div className="builder-layout">
        <div className="card builder-main">
          <div className="practice-builder-grid builder-fields">
            <label className="practice-builder-field">
              Предмет
              <select
                value={subjectId}
                disabled={busy}
                onChange={(e) => changeSubject(e.target.value)}
              >
                <option value="">Все предметы</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="practice-builder-field">
              Цель практики
              <select
                value={goal}
                disabled={busy}
                onChange={(e) => applyGoal(e.target.value as PracticeGoal)}
              >
                {practiceGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="muted builder-help">
            Цель задаёт подсказки и обратную связь; подготовка к семинару или
            экзамену также задаёт сложность и количество. Все настройки можно
            изменить.
          </p>
          <label className="practice-builder-field builder-count">
            <span className="spread">
              <span>Количество заданий</span>
              <strong>{count}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={count}
              disabled={busy}
              aria-label="Количество заданий"
              onChange={(e) => setCount(Number(e.target.value))}
            />
            <span className="builder-ticks" aria-hidden="true">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </span>
          </label>
          <fieldset className="practice-builder-fieldset" disabled={busy}>
            <legend>Темы</legend>
            <div className="spread builder-topic-actions">
              <span className="muted">Выбрано тем: {chosenTopics.length}</span>
              <button
                type="button"
                className="button secondary"
                disabled={!suggestion.length}
                onClick={() => {
                  changeTopics(suggestion);
                  setNotice(
                    `Автоподбор заменил выбор: ${suggestion.length} тем.`,
                  );
                }}
              >
                <Sparkles size={15} />
                Автоподбор тем
              </button>
            </div>
            <small className="muted">
              Автоподбор заменяет выбор темами из программы курса с подходящими
              заданиями. Пустой выбор — все темы предмета.
            </small>
            <div className="builder-topic-browser">
              <nav className="builder-modules" aria-label="Разделы тем">
                {modules.map((m) => {
                  const group = visibleTopics.filter(
                    (t) => t.moduleId === m.id,
                  );
                  return (
                    <button
                      type="button"
                      key={m.id}
                      aria-pressed={activeModule?.id === m.id}
                      onClick={() => {
                        setModuleId(m.id);
                        setSearch("");
                      }}
                    >
                      <BookOpen size={16} />
                      <span>
                        {m.title}
                        {!subjectId && (
                          <small>
                            {subjects.find((s) => s.id === m.subjectId)?.title}
                          </small>
                        )}
                      </span>
                      <span className="builder-module-count">
                        {group.filter((t) => topicIds.includes(t.id)).length}/
                        {group.length}
                      </span>
                    </button>
                  );
                })}
              </nav>
              <div className="builder-topic-panel">
                <label className="builder-search">
                  <Search size={17} />
                  <input
                    type="search"
                    aria-label="Поиск тем в разделе"
                    placeholder="Найти тему в разделе"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <FilterSelectAll
                  label="Выбрать все темы"
                  description="Все доступные темы активного раздела по текущему поиску, включая темы ниже в списке."
                  selected={topicIds}
                  available={selectableTopicIds}
                  limit={100}
                  onChange={(checked) =>
                    changeTopics(
                      setFilterSelection(
                        topicIds,
                        selectableTopicIds,
                        checked,
                        100,
                      ),
                    )
                  }
                />
                <div className="practice-builder-topics">
                  {listedTopics.map((topic) => {
                    const matches = matchingQuestionCount(topic, filters);
                    const selected = topicIds.includes(topic.id);
                    return (
                      <label key={topic.id}>
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={
                            !selected && (!matches || topicIds.length >= 100)
                          }
                          onChange={(e) =>
                            changeTopics(
                              setFilterSelection(
                                topicIds,
                                [topic.id],
                                e.target.checked,
                                100,
                              ),
                            )
                          }
                        />
                        <span>
                          {topic.title}
                          <small>
                            {matches
                              ? `${matches} заданий · ${curriculumLabel(topic.id)}`
                              : "Нет заданий по текущим фильтрам"}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                  {!listedTopics.length && (
                    <p className="muted">
                      Темы не найдены. Измени поиск или выбери другой раздел.
                    </p>
                  )}
                </div>
              </div>
            </div>
            {!!chosenTopics.length && (
              <div className="builder-selected">
                <div className="builder-tags">
                  {chosenTopics.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      aria-label={`Убрать тему: ${t.title}`}
                      onClick={() =>
                        changeTopics(topicIds.filter((id) => id !== t.id))
                      }
                    >
                      {t.title}
                      <X size={13} />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setTopicIds([]);
                    setNotice("");
                  }}
                >
                  Очистить все
                </button>
              </div>
            )}
            {notice && (
              <p className="muted" aria-live="polite">
                {notice}
              </p>
            )}
          </fieldset>
        </div>
        <aside
          className="card builder-summary"
          aria-labelledby="builder-summary-title"
        >
          <div className="spread">
            <SummaryHeading id="builder-summary-title">
              Параметры сессии
            </SummaryHeading>
            <SlidersHorizontal size={18} />
          </div>
          <dl>
            <div>
              <dt>Режим</dt>
              <dd>{activePreset?.title ?? "Свои настройки"}</dd>
            </div>
            <div>
              <dt>Предмет</dt>
              <dd>{subjectTitle}</dd>
            </div>
            <div>
              <dt>Цель</dt>
              <dd>{goalTitle}</dd>
            </div>
            <div>
              <dt>Заданий в сессии</dt>
              <dd>{count}</dd>
            </div>
            <div>
              <dt>Темы</dt>
              <dd>
                {chosenTopics.length
                  ? `Выбрано: ${chosenTopics.length}`
                  : `Все темы предмета: ${selectedTopics.length}`}
              </dd>
            </div>
          </dl>
          <div className="builder-summary-topics">
            {selectedTopics.map((t) => (
              <span key={t.id}>{t.title}</span>
            ))}
          </div>
          <div className="builder-availability">
            <strong>{available}</strong>
            <span>доступных заданий</span>
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
            className="button builder-start"
            disabled={busy || invalid}
            aria-busy={busy}
            onClick={start}
          >
            {busy ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <ArrowRight size={17} />
            )}{" "}
            {busy ? "Создаём сессию…" : "Начать практику"}
          </button>
          <small className="muted">
            Прогресс сохраняется после каждого ответа.
          </small>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
        </aside>
      </div>
      <details className="card builder-advanced">
        <summary>
          <SlidersHorizontal size={18} />
          <span>
            Расширенные настройки
            <small>Сложность, типы заданий, подсказки и обратная связь</small>
          </span>
          <ChevronDown size={18} />
        </summary>
        <div className="builder-advanced-content">
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
              {Object.keys(typeNames).map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={
                      visibleTypes.includes(type) &&
                      questionTypes.includes(type)
                    }
                    disabled={!visibleTypes.includes(type)}
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
                  {!visibleTypes.includes(type) && (
                    <small> — нет в выбранных темах</small>
                  )}
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
      </details>
    </section>
  );
}
