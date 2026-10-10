import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock3,
  Languages,
  Lightbulb,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeading } from "@/components/ui";
import { RichText, MathFormula } from "@/components/markdown";
import { MarkRead, StartPractice } from "@/components/actions";
import { TutorPanel } from "@/components/tutor-panel";
import type { LessonSection } from "@/lib/content-source";
import { curriculumLabel } from "@/lib/curriculum";

type TopicContent = { sections: LessonSection[]; quizAnswer: string };
export default async function Topic({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    user = await requireUser();
  const t = await db.topic.findUnique({
    where: { id },
    include: {
      module: { include: { subject: true } },
      formulas: true,
      _count: { select: { questions: true } },
      progress: { where: { userId: user.id } },
    },
  });
  if (!t) notFound();
  const content = t.content as unknown as TopicContent;
  return (
    <>
      <Link className="breadcrumb" href={`/subjects/${t.module.subjectId}`}>
        {t.module.subject.title} / {t.module.title}
      </Link>
      <PageHeading
        eyebrow={t.english}
        title={t.title}
        description="Пойми идею. Разбери пример. Попробуй сам."
        action={
          <span className="date-label">
            <Clock3 size={16} />
            {t.estimatedMinutes} мин
          </span>
        }
      />
      <div className="lesson-layout">
        <article className="card lesson-content">
          <p className="pill">{curriculumLabel(id)}</p>
          {content.sections.map((s, index) => {
            const name = s.title,
              anchor = `section-${index}`;
            if (name === "Интуиция" || name === "Частая ошибка")
              return (
                <section
                  className={`callout ${name === "Частая ошибка" ? "warning" : ""}`}
                  id={anchor}
                  key={anchor}
                >
                  {name === "Интуиция" ? (
                    <Lightbulb size={21} />
                  ) : (
                    <AlertTriangle size={21} />
                  )}
                  <div>
                    <h3>{name === "Интуиция" ? "Представь это так" : name}</h3>
                    <RichText>{s.text}</RichText>
                    <TutorPanel
                      topicId={id}
                      sectionIndex={index}
                      label="Разобрать этот фрагмент"
                    />
                  </div>
                </section>
              );
            if (name === "Английские термины")
              return (
                <section id={anchor} key={anchor}>
                  <h2>Как это звучит на английском</h2>
                  <div className="terminology">
                    <Languages size={20} />
                    <RichText>{s.text}</RichText>
                  </div>
                  <TutorPanel
                    topicId={id}
                    sectionIndex={index}
                    label="Разобрать этот фрагмент"
                  />
                </section>
              );
            if (name === "Формула и её смысл")
              return (
                <section id={anchor} key={anchor}>
                  <h2>{name}</h2>
                  {t.formulas.length ? (
                    t.formulas.map((f) => (
                      <div key={f.id}>
                        <MathFormula latex={f.latex} />
                        <RichText>{f.variables}</RichText>
                      </div>
                    ))
                  ) : (
                    <RichText>{s.text}</RichText>
                  )}
                  <TutorPanel
                    topicId={id}
                    sectionIndex={index}
                    label="Разобрать этот фрагмент"
                  />
                </section>
              );
            if (name === "Проверь понимание")
              return (
                <section id={anchor} key={anchor}>
                  <h2>{name}</h2>
                  <RichText>{s.text}</RichText>
                  <details className="self-check">
                    <summary>Показать ответ для самопроверки</summary>
                    <p>{content.quizAnswer}</p>
                    <small>
                      Самопроверка не начисляет XP. Для отслеживания прогресса
                      пройди практику.
                    </small>
                  </details>
                  <TutorPanel
                    topicId={id}
                    sectionIndex={index}
                    label="Разобрать этот фрагмент"
                  />
                </section>
              );
            return (
              <section id={anchor} key={anchor}>
                {name === "Что это?" && (
                  <div className="lesson-section-label">
                    <BookOpen size={17} />
                    01 · РАЗБИРАЕМСЯ В ИДЕЕ
                  </div>
                )}
                {name === "Разберём на примере" && (
                  <div className="lesson-section-label">
                    02 · ОТ ИДЕИ К РЕШЕНИЮ
                  </div>
                )}
                <h2>{name}</h2>
                {name === "Как говорит преподаватель" ? (
                  <blockquote>{s.text}</blockquote>
                ) : (
                  <RichText>{s.text}</RichText>
                )}
                <TutorPanel
                  topicId={id}
                  sectionIndex={index}
                  label="Разобрать этот фрагмент"
                />
              </section>
            );
          })}
          <div className="lesson-actions">
            <MarkRead topicId={id} read={!!t.progress[0]?.readAt} />
            {t._count.questions ? (
              <div className="button-row">
                <StartPractice mode="topic" topicId={id} />
                <Link
                  className="button secondary"
                  href={`/practice?topic=${encodeURIComponent(id)}#custom-practice`}
                >
                  Выбрать сложность и тип заданий
                </Link>
              </div>
            ) : (
              <p role="status" className="muted">
                Для этой темы пока нет заданий для практики.
              </p>
            )}
          </div>
        </article>
        <aside className="lesson-aside">
          <div className="card contents-card">
            <h3>В этой теме</h3>
            {content.sections.map((s, index) => (
              <a href={`#section-${index}`} key={index}>
                {s.title}
              </a>
            ))}
          </div>
          <div className="card tutor-card">
            <h3>AI Tutor</h3>
            <p>
              Разбери непонятный шаг, попроси пример и проверь понимание темы.
            </p>
            <TutorPanel topicId={id} />
            <small>Короткие объяснения · Материалы курса</small>
          </div>
          <div className="lesson-tip">
            Понимание важнее скорости.
            <br />
            Возвращайся к примеру столько раз, сколько нужно.
          </div>
        </aside>
      </div>
    </>
  );
}
