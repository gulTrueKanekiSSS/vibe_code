import Link from "next/link";
import { ProgressBar } from "./ui";
export function SubjectOverview({
  subjects,
  topics,
}: {
  subjects: { id: string; title: string; color: string }[];
  topics: {
    subjectId: string;
    started: boolean;
    mastery: number;
    assessed: boolean;
    readAt: Date | null;
  }[];
}) {
  return (
    <div className="card subject-mastery">
      {subjects.map((subject) => {
        const all = topics.filter((t) => t.subjectId === subject.id),
          started = all.filter((t) => t.started),assessed=all.filter(t=>t.assessed);
        const value = assessed.length
          ? Math.round(
              assessed.reduce((sum, t) => sum + t.mastery, 0) / assessed.length,
            )
          : 0;
        return (
          <div key={subject.id}>
            <div className="spread">
              <Link href={`/subjects/${subject.id}`}>{subject.title}</Link>
              <strong>{assessed.length?`${value}%`:'Нет оценки'}</strong>
            </div>
            <ProgressBar value={value} color={subject.color} />
            <small className="muted">
              {started.length} тем начато · {assessed.length} оценено · {all.filter((t) => t.readAt).length}{" "}
              / {all.length} прочитано
            </small>
          </div>
        );
      })}
    </div>
  );
}
