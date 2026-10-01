import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Clock3,
  BookOpen,
  Target,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProgress } from "@/lib/progress";
import {
  PageHeading,
  Stats,
  SectionHeading,
  SubjectIcon,
  ProgressBar,
} from "@/components/ui";
import { StartPractice } from "@/components/actions";
export default async function Dashboard() {
  const user = await requireUser(),
    p = await getProgress(user.id);
  const next =
    p.topics.find((t) => t.started && !t.readAt) ??
    p.topics.find((t) => !t.readAt) ??
    p.topics[0];
  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone: "Europe/Moscow",
  }).format(new Date());
  return (
    <>
      <PageHeading
        eyebrow="ТВОЁ ОБУЧЕНИЕ, В ТВОЁМ ТЕМПЕ"
        title={`Привет, ${user.firstName} 👋`}
        description="Хороший день, чтобы разобраться в чём-то новом."
        action={
          <span className="date-label">
            <CalendarDays size={16} />
            {date}
          </span>
        }
      />
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          <section className="continue-card">
            <div className="continue-copy">
              <span className="hero-tag">
                <span />
                ПРОДОЛЖИТЬ ОБУЧЕНИЕ
              </span>
              <div className="hero-subject">
                {next?.subjectTitle ?? "Начни свой путь"}
              </div>
              <h2>{next?.title ?? "Предметы"}</h2>
              <p>
                Разберись в идее, посмотри пример
                <br />и закрепи понимание на практике.
              </p>
              <div className="hero-meta">
                <span>
                  <Clock3 size={14} />
                  {next?.estimatedMinutes ?? 6} минут
                </span>
                <span>
                  <BookOpen size={14} />
                  Теория + практика
                </span>
              </div>
              <Link
                className="button"
                href={next ? `/topics/${next.id}` : "/subjects"}
              >
                Продолжить обучение
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="vector-art" aria-hidden="true">
              <svg viewBox="0 0 280 230">
                <defs>
                  <pattern
                    id="grid"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 24 0 L 0 0 0 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth=".5"
                    />
                  </pattern>
                  <marker
                    id="arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6" fill="#a19be8" />
                  </marker>
                  <marker
                    id="arrow2"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6" fill="#6c58cd" />
                  </marker>
                </defs>
                <rect width="280" height="230" fill="url(#grid)" />
                <path
                  d="M35 185 L240 185 M55 210 L55 25"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M55 185 L207 57"
                  stroke="#a19be8"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow)"
                />
                <path
                  d="M55 185 L209 185"
                  stroke="#6c58cd"
                  strokeWidth="3"
                  markerEnd="url(#arrow2)"
                />
                <path d="M207 60 V185" stroke="#a19be8" strokeDasharray="5 5" />
                <path d="M192 185 V171 H207" stroke="#a19be8" fill="none" />
                <path
                  d="M90 185 A35 35 0 0 0 82 162"
                  stroke="#8e80ce"
                  fill="none"
                />
                <text x="132" y="99">
                  a
                </text>
                <text x="225" y="181">
                  b
                </text>
                <text x="100" y="211" className="svg-formula">
                  projᵦ(a)
                </text>
                <text x="96" y="169">
                  θ
                </text>
                <circle cx="55" cy="185" r="4" fill="#6c58cd" />
              </svg>
            </div>
          </section>
          <Stats {...p} />
          <section>
            <SectionHeading
              title="Мои предметы"
              href="/subjects"
              label="Все предметы"
            />
            <div className="subject-list">
              {p.subjects.map((s) => {
                const topics = p.topics.filter((t) => t.subjectId === s.id),
                  done = topics.filter((t) => t.readAt).length,
                  value = Math.round((done / topics.length) * 100);
                return (
                  <Link
                    className="subject-row"
                    key={s.id}
                    href={`/subjects/${s.id}`}
                  >
                    <SubjectIcon icon={s.icon} color={s.color} />
                    <div className="subject-row-title">
                      <h3>{s.title}</h3>
                      <p>{s.english}</p>
                    </div>
                    <div className="subject-row-progress">
                      <span>
                        {done} <small>/ {topics.length} тем</small>
                        <b>{value}%</b>
                      </span>
                      <ProgressBar value={value} color={s.color} />
                    </div>
                    <ArrowUpRight size={18} className="muted" />
                  </Link>
                );
              })}
            </div>
          </section>
          <section>
            <SectionHeading
              title="Последняя активность"
              href="/progress"
              label="Весь прогресс"
            />
            {p.evidence.length ? (
              <div className="card activity-list">
                {p.evidence.slice(0, 3).map((e, i) => (
                  <div className="activity-row" key={i}>
                    <CheckCircle2 size={20} />
                    <div>
                      <strong>
                        {p.topics.find((t) => t.id === e.topicId)?.title}
                      </strong>
                      <small>
                        {e.correct
                          ? "Задание решено"
                          : "Есть повод повторить тему"}{" "}
                        ·{" "}
                        {new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "short",
                        }).format(e.completedAt)}
                      </small>
                    </div>
                    <span className="xp-label">+{e.xp} XP</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="first-step">
                <TrendingUp size={22} />
                <div>
                  <strong>Каждое понимание начинается с первого шага</strong>
                  <p>
                    Реши первое задание — здесь появится история твоего роста.
                  </p>
                </div>
                <Link href="/practice" aria-label="Начать практику">
                  <ArrowRight size={20} />
                </Link>
              </div>
            )}
          </section>
        </div>
        <aside className="dashboard-secondary">
          <section className="card daily-card">
            <div className="card-top">
              <span className="mini-icon violet">
                <Target size={19} />
              </span>
              <span className="pill">НА СЕГОДНЯ</span>
            </div>
            <h2>
              Немного практики.
              <br />
              Больше уверенности.
            </h2>
            <p>
              Подборка с учётом твоих слабых
              <br />и недавно изученных тем.
            </p>
            <div className="daily-meta">
              <span>
                <BookOpen size={15} />5 заданий
              </span>
              <span>
                <Clock3 size={15} />
                ~10 мин
              </span>
            </div>
            <StartPractice mode="daily" />
            <div className="daily-foot">
              <Sparkles size={13} />
              Новый набор каждый день
            </div>
          </section>
          <section className="card weak-card">
            <SectionHeading title="Стоит повторить" href="/progress" label="" />
            {p.weak.length ? (
              <>
                <p>
                  Немного внимания этим темам —<br />и всё встанет на свои
                  места.
                </p>
                <div className="weak-list">
                  {p.weak.slice(0, 3).map((t) => (
                    <Link href={`/topics/${t.id}`} key={t.id}>
                      <div>
                        <strong>{t.title}</strong>
                        <span>{t.mastery}%</span>
                      </div>
                      <ProgressBar value={t.mastery} color="orange" />
                    </Link>
                  ))}
                </div>
                <StartPractice mode="weak" secondary>
                  Повторить темы
                </StartPractice>
              </>
            ) : (
              <div className="weak-empty">
                <CheckCircle2 size={27} />
                <h3>Начнём с чистого листа</h3>
                <p>
                  После практики здесь появятся темы, которым стоит уделить
                  внимание.
                </p>
              </div>
            )}
          </section>
          <section className="term-card">
            <div className="eyebrow">АНГЛИЙСКИЙ БЕЗ БАРЬЕРА</div>
            <span className="term-decoration">Aa</span>
            <h3>Make it make sense.</h3>
            <p>
              Понимай идеи на русском.
              <br />
              Узнавай их на английском.
            </p>
            <Link href="/search?q=projection">
              Исследовать термины
              <ArrowUpRight size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
