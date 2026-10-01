import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProgress } from "@/lib/progress";
import { PageHeading, SubjectIcon, ProgressBar } from "@/components/ui";
export default async function Subjects() {
  const p = await getProgress((await requireUser()).id);
  return (
    <>
      <PageHeading
        eyebrow="БИБЛИОТЕКА ЗНАНИЙ"
        title="Мои предметы"
        description="Большие дисциплины. Понятные темы. Один шаг за раз."
      />
      <div className="subject-cards">
        {p.subjects.map((s) => {
          const topics = p.topics.filter((t) => t.subjectId === s.id),
            done = topics.filter((t) => t.readAt).length,
            assessed=topics.filter(t=>t.assessed),m=assessed.length?Math.round(assessed.reduce((a,t)=>a+t.mastery,0)/assessed.length):null;
          return (
            <Link
              className="card subject-card"
              href={`/subjects/${s.id}`}
              key={s.id}
            >
              <SubjectIcon icon={s.icon} color={s.color} />
              <div>
                <span className="muted text-small">{s.english}</span>
                <h2>{s.title}</h2>
                <p>{s.description}</p>
              </div>
              <div className="spread">
                <span>
                  {done} / {topics.length} тем прочитано
                </span>
                <strong>{Math.round((done / topics.length) * 100)}%</strong>
              </div>
              <ProgressBar
                value={(done / topics.length) * 100}
                color={s.color}
              />
              <div className="spread">
                <span className="muted">Mastery · {m===null?'Нет оценки':`${m}%`}</span>
                <span className="text-link">
                  Продолжить
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
