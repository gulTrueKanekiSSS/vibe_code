import Link from "next/link";
import { Award, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProgress, getLeaderboard } from "@/lib/progress";
import {
  PageHeading,
  Stats,
  SectionHeading,
  ProgressBar,
} from "@/components/ui";
import { PrivacySettings } from "@/components/actions";
import { SubjectOverview } from "@/components/subject-overview";
export default async function Profile() {
  const user = await requireUser(),
    p = await getProgress(user.id),
    ranking = await getLeaderboard("all"),
    rank = ranking.findIndex((u) => u.id === user.id);
  const achievements = [
    {
      title: "Первый шаг",
      description: "Решить первое задание",
      earned: p.solved >= 1,
    },
    {
      title: "В учебном ритме",
      description: "Серия из 3 дней",
      earned: p.streak >= 3,
    },
    {
      title: "Любопытный ум",
      description: "Прочитать 5 тем",
      earned: p.completed >= 5,
    },
    {
      title: "Практика в привычке",
      description: "Решить 30 разных заданий",
      earned: p.solved >= 30,
    },
  ];
  return (
    <>
      <PageHeading
        title="Мой профиль"
        description="Твой учебный путь и настройки личного пространства."
      />
      <section className="card profile-header">
        {user.photoUrl ? (
          // The owner can see their own photo regardless of its public visibility.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoUrl} className="avatar large" alt="Фото профиля" referrerPolicy="no-referrer" />
        ) : <span className="avatar large">{user.firstName[0]}</span>}
        <div>
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p>{user.username ? `@${user.username}` : "Личный аккаунт"}</p>
        </div>
        <span className="pill">
          {rank >= 0 ? `#${rank + 1} в рейтинге` : "Приватное пространство"}
        </span>
      </section>
      <Stats {...p} />
      <section className="profile-subjects">
        <SectionHeading title="Прогресс по предметам" />
        <SubjectOverview subjects={p.subjects} topics={p.topics} />
      </section>
      <div className="profile-grid">
        <section className="card">
          <div className="section-heading">
            <h2>Приватность</h2>
            <ShieldCheck size={21} />
          </div>
          <p className="muted">
            Ты выбираешь, что увидят другие участники. По умолчанию всё скрыто.
          </p>
          <PrivacySettings
            initial={{
              showUsername: user.settings?.showUsername ?? false,
              showPhoto: user.settings?.showPhoto ?? false,
              leaderboard: user.settings?.leaderboard ?? false,
            }}
          />
        </section>
        <section className="card">
          <SectionHeading title="Достижения" />
          {achievements.map((a) => (
            <div
              className={`achievement ${a.earned ? "earned" : ""}`}
              key={a.title}
            >
              <Award size={24} />
              <div>
                <strong>{a.title}</strong>
                <small>{a.description}</small>
              </div>
              <span>{a.earned ? "✓" : "○"}</span>
            </div>
          ))}
        </section>
      </div>
      <SectionHeading title="Сильные стороны" />
      <div className="card subject-mastery">
        {p.topics
          .filter((t) => t.assessed && t.mastery >= 60)
          .sort((a, b) => b.mastery - a.mastery)
          .slice(0, 5)
          .map((t) => (
            <div key={t.id}>
              <div className="spread">
                <Link href={`/topics/${t.id}`}>{t.title}</Link>
                <strong>{t.mastery}%</strong>
              </div>
              <ProgressBar value={t.mastery} />
            </div>
          ))}
        {!p.topics.some((t) => t.assessed&&t.mastery >= 60) && (
          <p className="muted">
            Темы с mastery от 60% появятся здесь после практики.
          </p>
        )}
      </div>
    </>
  );
}
