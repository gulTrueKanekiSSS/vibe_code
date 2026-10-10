"use client";

import Link from "next/link";
import { useState } from "react";
import { FinishPractice } from "./finish-practice";

export type UnfinishedPracticeView = {
  id: string;
  label: string;
  createdLabel: string;
  completed: number;
  total: number;
  blocksTutor: boolean;
};

export function UnfinishedPractice({
  sessions,
}: {
  sessions: UnfinishedPracticeView[];
}) {
  const [visible, setVisible] = useState(10);
  return (
    <section id="unfinished-sessions" aria-labelledby="unfinished-heading">
      <h2 id="unfinished-heading">Незавершённые сессии ({sessions.length})</h2>
      <p className="muted">
        Продолжи с сохранённого места или заверши сессию досрочно. Закрытие
        вкладки не завершает практику.
      </p>
      <div className="unfinished-sessions">
        {sessions.slice(0, visible).map((session) => (
          <article
            className="card unfinished-session"
            key={session.id}
            aria-label={`${session.label} · ${session.createdLabel}`}
          >
            <h3>{session.label}</h3>
            <p>
              {session.createdLabel} · Выполнено {session.completed} из{" "}
              {session.total}
            </p>
            {session.blocksTutor && (
              <p className="pill">Блокирует AI Tutor до завершения</p>
            )}
            <div className="button-row">
              <Link className="button" href={`/practice/${session.id}`}>
                Продолжить
              </Link>
              <FinishPractice sessionId={session.id} />
            </div>
          </article>
        ))}
      </div>
      {visible < sessions.length && (
        <button
          type="button"
          className="button secondary"
          onClick={() => setVisible((count) => count + 10)}
        >
          Показать ещё ({sessions.length - visible})
        </button>
      )}
    </section>
  );
}
