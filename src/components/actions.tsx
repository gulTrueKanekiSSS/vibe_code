"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
export function StartPractice({
  mode = "quick",
  topicId,
  subjectId,
  children = "Начать практику",
  secondary = false,
}: {
  mode?: string;
  topicId?: string;
  subjectId?: string;
  children?: React.ReactNode;
  secondary?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    router = useRouter();
  const inFlight = useRef(false);
  const operation = useRef<{ scope: string; key: string } | null>(null);
  async function start() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const scope = JSON.stringify([mode, topicId, subjectId]);
      if (operation.current?.scope !== scope)
        operation.current = { scope, key: crypto.randomUUID() };
      const r = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          mode,
          topicId,
          subjectId,
          requestKey: operation.current.key,
        }),
      });
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      if (typeof data.sessionId !== "string" || !data.sessionId)
        throw new Error("Не удалось открыть практику. Попробуй ещё раз.");
      router.push(`/practice/${data.sessionId}`);
    } catch (e) {
      inFlight.current = false;
      setError(e instanceof Error ? e.message : "Ошибка сети.");
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={start}
        className={`button ${secondary ? "secondary" : ""}`}
      >
        {busy ? <LoaderCircle size={16} className="spin" /> : null}
        {children}
        <ArrowRight size={17} />
      </button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
export function MarkRead({
  topicId,
  read,
}: {
  topicId: string;
  read: boolean;
}) {
  const [done, setDone] = useState(read),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    router = useRouter();
  async function mark() {
    setBusy(true);
    try {
      const r = await fetch("/api/topics/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      if (!r.ok) throw new Error();
      setDone(true);
      router.refresh();
    } catch {
      setError("Не удалось сохранить. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="button secondary"
        disabled={done || busy}
        onClick={mark}
      >
        {done ? <Check size={17} /> : null}
        {done ? "Тема прочитана" : "Отметить как прочитанное"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function PrivacySettings({
  initial,
}: {
  initial: { showUsername: boolean; showPhoto: boolean; leaderboard: boolean };
}) {
  const [values, setValues] = useState(initial),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!r.ok) throw new Error();
      setMessage("Настройки сохранены.");
    } catch {
      setMessage("Не удалось сохранить настройки.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {(
        [
          [
            "showUsername",
            "Показывать Telegram username",
            "Другие участники смогут увидеть твой псевдоним.",
          ],
          [
            "showPhoto",
            "Показывать фото профиля",
            "Использовать фотографию Telegram в рейтинге.",
          ],
          [
            "leaderboard",
            "Участвовать в рейтинге",
            "Публиковать имя, Practice GPA и XP.",
          ],
        ] as const
      ).map(([key, title, description]) => (
        <label className="setting-row" key={key}>
          <span>
            <strong>{title}</strong>
            <small>{description}</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={values[key]}
            onChange={(e) => {
              setValues({ ...values, [key]: e.target.checked });
              setMessage("");
            }}
          />
        </label>
      ))}
      <button className="button" disabled={busy} onClick={save}>
        {busy ? "Сохраняем…" : "Сохранить настройки"}
      </button>
      <p role="status" className="muted">
        {message}
      </p>
    </div>
  );
}
