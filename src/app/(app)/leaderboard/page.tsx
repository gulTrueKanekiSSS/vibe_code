import Link from "next/link";
import { Trophy, ShieldCheck } from "lucide-react";
import { getLeaderboard } from "@/lib/progress";
import { RULES } from "@/lib/learning";
import { PageHeading, Empty } from "@/components/ui";
export default async function Leaderboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "week" } = await searchParams,
    rows = await getLeaderboard(period);
  return (
    <>
      <PageHeading
        eyebrow="РАСТЁМ ВМЕСТЕ"
        title="Рейтинг студентов"
        description="Сначала понимание, затем активность. Учись в своём темпе."
      />
      <div className="leaderboard-intro card">
        <span className="mini-icon violet">
          <Trophy size={25} />
        </span>
        <div>
          <h3>Знания важнее количества кликов</h3>
          <p>
            Для участия: {RULES.eligibleSolved} разных решённых заданий и{" "}
            {RULES.eligibleTopics} темы за выбранный период. Место определяется
            mastery, затем XP.
          </p>
        </div>
      </div>
      <nav className="tabs" aria-label="Период рейтинга">
        {[
          ["week", "Эта неделя"],
          ["month", "Этот месяц"],
          ["all", "За всё время"],
        ].map(([id, label]) => (
          <Link
            key={id}
            className={period === id ? "selected" : ""}
            href={`/leaderboard?period=${id}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Место</th>
                <th>Студент</th>
                <th>Mastery</th>
                <th>Practice GPA</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.id}>
                  <td>#{i + 1}</td>
                  <td>
                    <div className="leaderboard-user">
                      {u.photoUrl ? (
                        // Profile images are remote user URLs, intentionally not fetched by our server.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.photoUrl}
                          referrerPolicy="no-referrer"
                          alt=""
                          className="avatar small"
                        />
                      ) : (
                        <span className="avatar small">{u.name[0]}</span>
                      )}
                      <div>
                        {u.name}
                        {u.username && <small>@{u.username}</small>}
                      </div>
                    </div>
                  </td>
                  <td>{u.mastery}%</td>
                  <td>{u.gpa.toFixed(2)}</td>
                  <td>{u.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Здесь скоро появятся первые участники">
          Практикуйся и включи участие в рейтинге в профиле. Участники появятся
          после достижения порога активности.
        </Empty>
      )}
      <p className="privacy-note">
        <ShieldCheck size={17} />
        Участие добровольное. Публичные данные контролируются настройками
        профиля.
      </p>
    </>
  );
}
