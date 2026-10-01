import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProgress } from "@/lib/progress";
import { masteryLabel, RULES } from "@/lib/learning";
import { SubjectOverview } from "@/components/subject-overview";
import {
  PageHeading,
  Stats,
  SectionHeading,
  ProgressBar,
  Empty,
} from "@/components/ui";
export default async function Progress() {
  const p = await getProgress((await requireUser()).id);
  return (
    <>
      <PageHeading
        eyebrow="СМОТРИ, КАК ДАЛЕКО ТЫ ПРОДВИНУЛСЯ"
        title="Мой прогресс"
        description="Активность — это XP. Понимание — это mastery. Оба показателя важны."
      />
      <Stats {...p} />
      <div className="progress-overview card">
        <div>
          <span className="eyebrow">ОБЩЕЕ ПОНИМАНИЕ</span>
          <h2>
            {p.overall === null ? "Нет оценки" : `${p.overall}%`}{" "}
            <small>
              {p.overall === null ? "Начни практику" : masteryLabel(p.overall)}
            </small>
          </h2>
          <p>
            Среднее по {p.assessedCount} оценённым темам. Это учебный
            показатель, а не официальный GPA.
          </p>
        </div>
        <div>
          <span>
            {p.completed} из {p.topics.length} тем прочитано
          </span>
          <ProgressBar value={(p.completed / p.topics.length) * 100} />
        </div>
      </div>
      <SectionHeading title="Понимание по предметам" />
      <SubjectOverview subjects={p.subjects} topics={p.topics} />
      {p.assessedCount > 0 && (
        <>
          <SectionHeading title="Результаты по сложности" />
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Тема</th>
                  <th>Базовый</th>
                  <th>Средний</th>
                  <th>Сложный</th>
                  <th>Вызов</th>
                </tr>
              </thead>
              <tbody>
                {p.topics
                  .filter((topic) => topic.assessed)
                  .map((topic) => (
                    <tr key={topic.id}>
                      <td>
                        <Link href={`/topics/${topic.id}`}>{topic.title}</Link>
                      </td>
                      {(["EASY", "MEDIUM", "HARD", "CHALLENGE"] as const).map(
                        (level) => {
                          const row = topic.difficultyPerformance[level];
                          return (
                            <td key={level}>
                              {row.total
                                ? `${Math.round((row.correct / row.total) * 100)}% (${row.correct}/${row.total})`
                                : "—"}
                            </td>
                          );
                        },
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <SectionHeading title="Слабые темы" />
      {p.weak.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Тема</th>
                <th>Mastery</th>
                <th>Следующий шаг</th>
              </tr>
            </thead>
            <tbody>
              {p.weak.slice(0, 5).map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/topics/${t.id}`}>{t.title}</Link>
                    <small>{t.subjectTitle}</small>
                  </td>
                  <td>{t.mastery}%</td>
                  <td>
                    <Link className="text-link" href={`/topics/${t.id}`}>
                      Повторить →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">
          Пока нет оценённых тем, которым требуется повторение.
        </p>
      )}
      <SectionHeading title="Темы и точки роста" />
      {p.topics.some((t) => t.started) ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Тема</th>
                <th>Mastery</th>
                <th>Уровень</th>
                <th>Повторение</th>
              </tr>
            </thead>
            <tbody>
              {p.topics
                .filter((t) => t.started)
                .sort((a, b) => a.mastery - b.mastery)
                .map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/topics/${t.id}`}>{t.title}</Link>
                      <small>{t.english}</small>
                    </td>
                    <td>{t.assessed ? `${t.mastery}%` : "Нет оценки"}</td>
                    <td>
                      {t.assessed
                        ? masteryLabel(t.mastery)
                        : "Сначала практика"}
                    </td>
                    <td>
                      <Link className="text-link" href={`/topics/${t.id}`}>
                        {t.assessed && t.mastery < RULES.weakThreshold
                          ? "Повторить"
                          : "К теме"}{" "}
                        →
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Твой прогресс начинается здесь">
          Открой тему или реши первое задание, чтобы увидеть свои сильные
          стороны.
        </Empty>
      )}
      <SectionHeading title="История практики" />
      {p.evidence.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Тема</th>
                <th>Дата</th>
                <th>Результат</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {p.evidence.slice(0, 30).map((e, i) => (
                <tr key={i}>
                  <td>{p.topics.find((t) => t.id === e.topicId)?.title}</td>
                  <td>{e.completedAt.toLocaleDateString("ru-RU")}</td>
                  <td>
                    {e.correct ? "✓ Верно" : "↻ Повторить"} · {e.attempts}{" "}
                    попыт.
                  </td>
                  <td>+{e.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">История появится после первой практики.</p>
      )}
    </>
  );
}
