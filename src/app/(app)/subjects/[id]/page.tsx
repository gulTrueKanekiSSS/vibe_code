import Link from "next/link";
import { notFound } from "next/navigation";
import { Circle, CheckCircle2, ArrowRight, Clock3, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProgress } from "@/lib/progress";
import { PageHeading, ProgressBar } from "@/components/ui";
import { StartPractice } from "@/components/actions";
import { curriculumLabel } from "@/lib/curriculum";
export default async function Subject({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    p = await getProgress((await requireUser()).id),
    s = p.subjects.find((s) => s.id === id);
  if (!s) notFound();
  return (
    <>
      <Link className="breadcrumb" href="/subjects">
        Предметы / {s.english}
      </Link>
      <PageHeading
        title={s.title}
        description={s.description}
        action={<StartPractice mode="subject" subjectId={id} />}
      />
      <div className="module-list">
        {s.modules.map((m, i) => (
          <section className="card module-card" key={m.id}>
            <div className="module-title">
              <span className="module-number">0{i + 1}</span>
              <h2>{m.title}</h2>
              <span className="muted">{m.topics.length} тем</span>
            </div>
            {m.topics.map((t) => {
              const progress = p.topics.find((x) => x.id === t.id)!;
              return (
                <Link className="topic-row" key={t.id} href={`/topics/${t.id}`}>
                  {progress.assessed && progress.mastery >= 95 ? (
                    <CheckCircle2 className="green" size={20} />
                  ) : progress.practiced ? (
                    <Target className="violet" size={20} />
                  ) : progress.started ? (
                    <ArrowRight className="orange" size={20} />
                  ) : (
                    <Circle size={20} className="muted" />
                  )}
                  <div className="topic-name">
                    <strong>{t.title}</strong>
                    <small>
                      {t.english} · {curriculumLabel(t.id)} ·{" "}
                      {progress.assessed && progress.mastery >= 95
                        ? "Освоено"
                        : progress.practiced
                          ? "Практика пройдена"
                          : progress.started
                            ? "Изучаю"
                            : "Не начато"}
                    </small>
                  </div>
                  <span className="topic-duration">
                    <Clock3 size={14} />
                    {t.estimatedMinutes} мин
                  </span>
                  <div className="topic-mastery">
                    <span>
                      {progress.assessed
                        ? `${progress.mastery}% mastery`
                        : "Нет оценки"}
                    </span>
                    <ProgressBar value={progress.mastery} />
                  </div>
                  <ArrowRight size={17} />
                </Link>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}
