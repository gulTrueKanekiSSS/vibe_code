import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Cpu,
  Braces,
  Waypoints,
  Axis3D,
  FunctionSquare,
  BookOpen,
  Flame,
  Zap,
  Target,
  GraduationCap,
} from "lucide-react";
import type { ReactNode } from "react";
export const subjectIcons: Record<string, typeof Cpu> = {
  cpu: Cpu,
  code: Braces,
  logic: Waypoints,
  vectors: Axis3D,
  function: FunctionSquare,
};
export function SubjectIcon({ icon, color }: { icon: string; color: string }) {
  const Icon = subjectIcons[icon] ?? BookOpen;
  return (
    <span className={`subject-icon ${color}`}>
      <Icon size={23} />
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function SectionHeading({
  title,
  href,
  label = "Все темы",
}: {
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {href && (
        <Link href={href} className="text-link">
          {label}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function ProgressBar({
  value,
  color = "violet",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div
      className={`progress-track ${color}`}
      role="progressbar"
      aria-label="Прогресс"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
export function Stats({
  xp,
  gpa,
  solved,
  streak,
}: {
  xp: number;
  gpa: number | null;
  solved: number;
  streak: number;
}) {
  return (
    <div className="stats-grid">
      {[
        {
          icon: Zap,
          label: "Всего опыта",
          value: xp.toLocaleString("ru-RU"),
          unit: "XP",
          color: "violet",
        },
        {
          icon: Target,
          label: "Решено заданий",
          value: solved,
          unit: "",
          color: "green",
        },
        {
          icon: GraduationCap,
          label: "Practice GPA",
          value: gpa===null?'—':gpa.toFixed(2),
          unit: gpa===null?'нет оценки':'/ 4.00',
          color: "blue",
        },
        {
          icon: Flame,
          label: "Серия занятий",
          value: streak,
          unit: "дн.",
          color: "orange",
        },
      ].map((s) => (
        <div className="stat-card" key={s.label}>
          <div className="stat-label">
            <span className={s.color}>
              <s.icon size={17} />
            </span>
            {s.label}
          </div>
          <div className="stat-value">
            {s.value}
            <small>{s.unit}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <BookOpen size={28} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function ArrowButton({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`button ${secondary ? "secondary" : ""}`} href={href}>
      {children}
      <ArrowRight size={17} />
    </Link>
  );
}
