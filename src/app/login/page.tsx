import { currentUser, devAuthEnabled } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Orbit, ArrowRight, CheckCircle2, Send } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentUser()) redirect("/");
  const { error } = await searchParams;
  return (
    <main className="login-page">
      <div className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <Orbit size={26} />
          </span>
          studyspace.
        </div>
        <div>
          <span className="eyebrow">ТВОЁ ПРОСТРАНСТВО ДЛЯ РОСТА</span>
          <h1>
            Не просто запомнить.
            <br />
            <em>Понять.</em>
          </h1>
          <p>
            Университетские темы — простыми словами.
            <br />
            От первого вопроса до уверенного решения.
          </p>
          <div className="login-points">
            {[
              "Понятные объяснения на русском",
              "Английские термины без барьера",
              "Практика, которая показывает прогресс",
            ].map((t) => (
              <div key={t}>
                <CheckCircle2 size={18} />
                {t}
              </div>
            ))}
          </div>
        </div>
        <span className="muted">Learn → Practice → Progress → Compete</span>
      </div>
      <section className="login-form">
        <span className="pill">Твой следующий шаг</span>
        <h2>Добро пожаловать</h2>
        <p>
          Войди, чтобы сохранять прогресс
          <br />и учиться в своём темпе.
        </p>
        <a className="button" href="/api/auth/telegram">
          <Send size={18} />
          Войти через Telegram
          <ArrowRight size={17} />
        </a>
        {error && (
          <p role="alert" className="error-text">
            {error === "config"
              ? "Для Telegram-входа укажи Client ID и Client Secret в настройках сервера."
              : "Не удалось войти. Попробуй ещё раз."}
          </p>
        )}
        {devAuthEnabled() && (
          <div className="dev-login">
            <span>ЛОКАЛЬНАЯ РАЗРАБОТКА</span>
            <form action="/api/auth/dev" method="post">
              <button className="button secondary">
                Войти в демо-аккаунт
                <ArrowRight size={17} />
              </button>
            </form>
            <small>
              Доступен только в development. Прогресс сохраняется в локальной
              базе.
            </small>
          </div>
        )}
        <p className="login-privacy">
          Твой профиль приватен по умолчанию.
          <br />
          Участие в рейтинге — только по твоему выбору.
        </p>
      </section>
    </main>
  );
}
