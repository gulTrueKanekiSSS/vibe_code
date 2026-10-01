"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>Не удалось загрузить страницу</h1>
      <p>
        Проверь соединение и попробуй ещё раз. Твой сохранённый прогресс
        останется в базе.
      </p>
      <button className="button" onClick={reset}>
        Попробовать снова
      </button>
    </main>
  );
}
