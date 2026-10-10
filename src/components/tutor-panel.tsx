"use client";
import Link from "next/link";
import { practiceSessionLabel } from "@/lib/practice-session-label";

import { useId, useRef, useState } from "react";
import { RefreshCw, Send, Sparkles, X } from "lucide-react";
import { TutorMessage } from "./tutor-message";
import type { TutorSnapshot } from "@/lib/tutor/types";

type Context = {
  topicId: string;
  sectionIndex?: number;
  practiceItemId?: string;
};
type Turn = { message: string; requestKey: string };
class TutorRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
const definitiveRejections = new Set([400, 401, 403, 404, 413, 429]);
const prompts = [
  [
    "Объясни проще",
    "Объясни основную идею проще и задай один короткий вопрос для проверки понимания.",
  ],
  [
    "Подскажи шаг",
    "Дай небольшую подсказку к следующему шагу, не раскрывая ответ.",
  ],
  ["Почему так?", "Объясни, почему это работает, на маленьком примере."],
  [
    "Проверь понимание",
    "Задай один короткий вопрос, чтобы проверить моё понимание этой темы.",
  ],
] as const;

export function TutorPanel({
  topicId,
  sectionIndex,
  practiceItemId,
  label = "Спросить AI Tutor",
  disabledReason,
}: Context & { label?: string; disabledReason?: string }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const inflight = useRef(false);
  const [snapshot, setSnapshot] = useState<TutorSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [retry, setRetry] = useState<Turn | null>(null);
  const [optimistic, setOptimistic] = useState("");
  const context: Context = {
    topicId,
    ...(sectionIndex !== undefined ? { sectionIndex } : {}),
    ...(practiceItemId ? { practiceItemId } : {}),
  };

  async function readSnapshot(response: Response): Promise<TutorSnapshot> {
    const data = await response.json();
    if (!response.ok)
      throw new TutorRequestError(
        data.error || "Не удалось связаться с Tutor. Попробуй ещё раз.",
        response.status,
      );
    return data;
  }

  async function refresh() {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ topicId });
      if (sectionIndex !== undefined)
        query.set("sectionIndex", String(sectionIndex));
      if (practiceItemId) query.set("practiceItemId", practiceItemId);
      const data = await readSnapshot(
        await fetch(`/api/tutor?${query}`, { cache: "no-store" }),
      );
      setSnapshot(data);
      setOptimistic("");
      if (
        retry &&
        data.messages.some(
          (message) =>
            message.requestKey === retry.requestKey &&
            message.role === "assistant" &&
            message.status !== "pending",
        )
      )
        setRetry(null);
    } catch (cause) {
      setSnapshot(null);
      setError(
        cause instanceof Error ? cause.message : "Ошибка сети. Обнови историю.",
      );
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }

  function open() {
    dialog.current?.showModal();
    void refresh();
  }

  async function send(turn: Turn) {
    if (inflight.current || !turn.message.trim()) return;
    inflight.current = true;
    setBusy(true);
    setError("");
    setRetry(turn);
    setOptimistic(turn.message);
    try {
      const data = await readSnapshot(
        await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context, ...turn }),
        }),
      );
      setSnapshot(data);
      setDraft(
        data.messages.some(
          (message) =>
            message.requestKey === turn.requestKey &&
            message.status === "failed",
        )
          ? turn.message
          : "",
      );
      setOptimistic("");
      setRetry(null);
    } catch (cause) {
      if (
        cause instanceof TutorRequestError &&
        definitiveRejections.has(cause.status)
      ) {
        // The server rejected admission: no ambiguous turn needs idempotent
        // recovery. Keep the draft editable rather than trapping it in retry.
        setRetry(null);
        setOptimistic("");
        setDraft(turn.message);
      }
      setError(
        cause instanceof Error
          ? cause.message
          : "Связь прервалась. Повтори запрос или обнови историю.",
      );
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }

  async function reset() {
    if (
      inflight.current ||
      !window.confirm(
        "Удалить историю этого разговора? Это действие нельзя отменить.",
      )
    )
      return;
    inflight.current = true;
    setLoading(true);
    setError("");
    try {
      setSnapshot(
        await readSnapshot(
          await fetch("/api/tutor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reset", context }),
          }),
        ),
      );
      setRetry(null);
      setOptimistic("");
      setDraft("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Не удалось очистить разговор.",
      );
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }

  const pending = snapshot?.messages.some(
    (message) => message.status === "pending",
  );
  const unavailable = snapshot && !snapshot.available;
  const pendingUser = pending
    ? snapshot?.messages.findLast(
        (message) => message.role === "user" && message.requestKey,
      )
    : undefined;
  const locked =
    loading ||
    busy ||
    !snapshot ||
    Boolean(unavailable) ||
    Boolean(pending) ||
    Boolean(retry);
  const current = snapshot?.context;

  return (
    <div className="tutor-entry">
      <button
        ref={trigger}
        className="button secondary tutor-trigger"
        type="button"
        disabled={Boolean(disabledReason)}
        aria-describedby={disabledReason ? `${id}-disabled` : undefined}
        aria-haspopup="dialog"
        onClick={open}
      >
        <Sparkles size={16} aria-hidden="true" />
        {label}
      </button>
      {disabledReason && (
        <p id={`${id}-disabled`} className="muted tutor-disabled">
          {disabledReason}
        </p>
      )}
      <dialog
        ref={dialog}
        className="tutor-dialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-privacy`}
        onClose={() => trigger.current?.focus()}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), a[href], textarea:not(:disabled), [tabindex="0"]',
            ),
          ).filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="tutor-shell">
          <header className="tutor-header">
            <div>
              <span className="eyebrow">РАЗБЕРЁМСЯ ПО ШАГАМ</span>
              <h2 id={`${id}-title`}>AI Tutor</h2>
            </div>
            <button
              autoFocus
              type="button"
              className="icon-button"
              aria-label="Закрыть Tutor"
              onClick={() => dialog.current?.close()}
            >
              <X size={21} />
            </button>
          </header>
          {current && (
            <p className="tutor-context" aria-label="Контекст Tutor">
              {[
                current.subjectTitle,
                current.moduleTitle,
                current.topicTitle,
                current.sectionTitle,
                current.practiceItemId ? "Текущее задание" : null,
              ]
                .filter(Boolean)
                .join(" / ")}
            </p>
          )}
          <p id={`${id}-privacy`} className="tutor-privacy">
            Сообщения и относящийся к вопросу материал курса отправляются
            внешней AI-модели. Не отправляй пароли и личные данные. Ответы могут
            содержать ошибки; сверяйся с источниками.
          </p>
          <div className="tutor-history-toolbar">
            <span>История этого контекста</span>
            <button
              type="button"
              className="text-link"
              disabled={loading || busy}
              onClick={() => void refresh()}
            >
              <RefreshCw size={14} />
              Обновить историю
            </button>
            {Boolean(snapshot?.messages.length) && (
              <button
                type="button"
                className="text-link"
                disabled={loading || busy || pending}
                onClick={() => void reset()}
              >
                Очистить разговор
              </button>
            )}
          </div>
          <div
            className="tutor-history"
            role="log"
            aria-label="Переписка с Tutor"
            aria-busy={loading || busy}
          >
            {loading && <p role="status">Загружаем историю…</p>}
            {unavailable && (
              <p role="status" className="tutor-notice">
                {snapshot.unavailableReason ||
                  "Tutor недоступен в текущем режиме практики. Вернись после её завершения."}
              </p>
            )}
            {unavailable && snapshot.blockingSession && (
              <div className="tutor-notice">
                <p>
                  {practiceSessionLabel(snapshot.blockingSession.mode)} ·{" "}
                  {new Date(
                    snapshot.blockingSession.createdAt,
                  ).toLocaleDateString("ru-RU", { timeZone: "UTC" })}
                </p>
                <p>
                  Эта сессия ещё не закрыта. Можно продолжить её или завершить
                  досрочно на странице практики.
                </p>
                <div className="button-row">
                  <Link
                    className="button secondary"
                    href={`/practice/${snapshot.blockingSession.id}`}
                  >
                    Продолжить сессию
                  </Link>
                  <Link
                    className="text-link"
                    href="/practice#unfinished-sessions"
                  >
                    Управлять незавершёнными сессиями
                  </Link>
                </div>
              </div>
            )}
            {current?.restricted && !unavailable && (
              <p className="tutor-notice">
                Пока задание не завершено, Tutor помогает выбрать следующий шаг.
                Проверка ответа и открытие подсказок остаются в практике.
              </p>
            )}
            {!loading &&
              snapshot &&
              !snapshot.messages.length &&
              !unavailable && (
                <div className="tutor-empty">
                  <Sparkles size={26} />
                  <h3>На каком шаге стало непонятно?</h3>
                  <p>
                    Опиши свою мысль или выбери короткий вопрос ниже. Разберём
                    одну идею за раз.
                  </p>
                </div>
              )}
            {snapshot?.messages.map((message) => (
              <article
                key={message.id}
                className={`tutor-message tutor-message-${message.role}`}
              >
                <strong>{message.role === "user" ? "Ты" : "Tutor"}</strong>
                {message.content && (
                  <TutorMessage>{message.content}</TutorMessage>
                )}
                {message.status === "pending" && (
                  <p role="status">
                    Tutor готовит ответ. Обнови историю через несколько секунд.
                  </p>
                )}
                {message.status === "failed" && (
                  <p className="error-text">
                    Не удалось получить ответ. Можно задать вопрос ещё раз.
                  </p>
                )}
                {message.sources.length > 0 && (
                  <nav className="tutor-sources" aria-label="Источники ответа">
                    <span>Материалы курса</span>
                    {message.sources.map((source) => (
                      <a key={source.id} href={source.url}>
                        {source.title}
                        {source.sectionTitle ? ` · ${source.sectionTitle}` : ""}
                        {source.page ? ` · стр. ${source.page}` : ""}
                      </a>
                    ))}
                  </nav>
                )}
              </article>
            ))}
            {optimistic &&
              !snapshot?.messages.some(
                (message) =>
                  message.role === "user" && message.content === optimistic,
              ) && (
                <article className="tutor-message tutor-message-user">
                  <strong>Ты</strong>
                  <p>{optimistic}</p>
                </article>
              )}
            {busy && <p role="status">Tutor готовит ответ…</p>}
            {pendingUser?.requestKey && !busy && (
              <button
                type="button"
                className="button secondary"
                disabled={loading}
                onClick={() =>
                  void send({
                    message: pendingUser.content,
                    requestKey: pendingUser.requestKey!,
                  })
                }
              >
                Проверить незавершённый запрос
              </button>
            )}
            {retry && !error && !busy && (
              <button
                type="button"
                className="button secondary"
                disabled={loading}
                onClick={() => void send(retry)}
              >
                Повторить запрос
              </button>
            )}
            {error && (
              <div role="alert" className="tutor-notice error-text">
                <p>{error}</p>
                {retry && (
                  <button
                    type="button"
                    className="button secondary"
                    disabled={busy || loading}
                    onClick={() => void send(retry)}
                  >
                    Повторить запрос
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="tutor-composer">
            <div className="tutor-prompts" aria-label="Быстрые вопросы">
              {prompts.map(([title, message]) => (
                <button
                  key={title}
                  type="button"
                  disabled={locked}
                  onClick={() => setDraft(message)}
                >
                  {title}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send({
                  message: draft.trim(),
                  requestKey: crypto.randomUUID(),
                });
              }}
            >
              <label htmlFor={`${id}-message`}>
                Твой вопрос или ход рассуждений
              </label>
              <textarea
                id={`${id}-message`}
                rows={3}
                maxLength={2000}
                value={draft}
                disabled={locked}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Я понимаю первый шаг, но почему…"
              />
              <div className="tutor-send-row">
                <small>История сохраняется в твоём аккаунте.</small>
                <button
                  type="submit"
                  className="button"
                  disabled={locked || !draft.trim()}
                >
                  <Send size={16} />
                  {busy ? "Отправляем…" : "Отправить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
