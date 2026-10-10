"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function FinishPractice({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const pending = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (confirming) {
      cancel.current?.focus();
      restoreFocus.current = true;
    } else if (restoreFocus.current) {
      trigger.current?.focus();
      restoreFocus.current = false;
    }
  }, [confirming]);
  async function finish() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", sessionId }),
      });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Не удалось завершить сессию.");
      router.push(`/practice/${sessionId}`);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ошибка сети. Попробуй ещё раз.",
      );
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="finish-practice">
      {!confirming ? (
        <button
          ref={trigger}
          className="button secondary"
          type="button"
          onClick={() => setConfirming(true)}
        >
          Завершить досрочно
        </button>
      ) : (
        <div
          role="group"
          aria-label="Подтверждение завершения"
          className="finish-confirmation"
        >
          <p>
            Завершить эту сессию? Продолжить её уже не получится. Результаты
            выполненных заданий сохранятся; незавершённые не засчитываются.
            После закрытия экзамена будут доступны результаты уже данных
            ответов.
          </p>
          <div className="button-row">
            <button
              className="button"
              type="button"
              disabled={busy}
              aria-busy={busy}
              onClick={() => void finish()}
            >
              {busy ? "Завершаем…" : "Да, завершить"}
            </button>
            <button
              className="button secondary"
              ref={cancel}
              type="button"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError("");
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
