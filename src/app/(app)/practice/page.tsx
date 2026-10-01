import Link from "next/link";
import {
  Target,
  CalendarDays,
  Flame,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProgress } from "@/lib/progress";
import { db } from "@/lib/db";
import { PageHeading, SectionHeading, SubjectIcon } from "@/components/ui";
import { StartPractice } from "@/components/actions";
import { PracticeSetup } from "@/components/practice-setup";
export default async function Practice({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; topic?: string; edit?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser(),
    p = await getProgress(user.id),
    active = await db.practiceSession.findMany({
      where: { userId: user.id, finishedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  return (
    <>
      <PageHeading
        eyebrow="ИЗ ЗНАНИЙ В НАВЫК"
        title="Время практики"
        description="Попробуй, ошибись, разберись. Здесь каждый ответ помогает учиться."
      />
      <div className="practice-modes">
        {[
          {
            mode: "daily",
            icon: CalendarDays,
            title: "Практика дня",
            description: "5 заданий по слабым и недавно изученным темам.",
            tag: "~10 минут",
          },
          {
            mode: "quick",
            icon: Target,
            title: "Быстрый старт",
            description: "Небольшая подборка, чтобы войти в учебный ритм.",
            tag: "5 заданий",
          },
          {
            mode: "weak",
            icon: Flame,
            title: "Слабые темы",
            description: "Удели внимание тому, что пока даётся сложнее.",
            tag: `${p.weak.length} тем`,
          },
          {
            mode: "exam",
            icon: GraduationCap,
            title: "Режим экзамена",
            description:
              "Проверь знания без подсказок. Без ограничения времени.",
            tag: "До 15 заданий",
          },
        ].map((m, i) => (
          <section
            className={`card practice-mode ${i === 0 ? "featured" : ""}`}
            key={m.mode}
          >
            <div className="spread">
              <span className="mini-icon violet">
                <m.icon size={22} />
              </span>
              <span className="pill">{m.tag}</span>
            </div>
            <h2>{m.title}</h2>
            <p>{m.description}</p>
            {m.mode === "weak" && !p.weak.length ? (
              <p role="status" className="muted">
                Пока нет слабых тем для повторения. Начни с быстрой практики.
              </p>
            ) : (
              <StartPractice mode={m.mode} secondary={i !== 0} />
            )}
          </section>
        ))}
      </div>
      <p>
        <Link className="text-link" href="/practice/custom">
          Открыть конструктор на отдельной странице
        </Link>
      </p>
      <PracticeSetup userId={user.id} query={query} />
      {active.length > 0 && (
        <section>
          <SectionHeading title="Продолжить сессию" />
          <div className="card">
            {active.map((s) => (
              <Link key={s.id} className="topic-row" href={`/practice/${s.id}`}>
                <Target size={18} />
                <span className="topic-name">
                  Незавершённая практика ·{" "}
                  {s.createdAt.toLocaleDateString("ru-RU")}
                </span>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </section>
      )}
      <SectionHeading title="Практика по предмету" />
      <div className="subject-cards">
        {p.subjects.map((s) => (
          <section className="card practice-subject" key={s.id}>
            <SubjectIcon icon={s.icon} color={s.color} />
            <h3>{s.title}</h3>
            <StartPractice mode="subject" subjectId={s.id} secondary />
            <Link className="text-link" href={`/subjects/${s.id}`}>
              Выбрать отдельную тему
              <ArrowRight size={14} />
            </Link>
          </section>
        ))}
      </div>
    </>
  );
}
