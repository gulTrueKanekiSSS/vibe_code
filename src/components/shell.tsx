"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  SquareFunction,
  ChartNoAxesCombined,
  Trophy,
  UserRound,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  Command,
  Orbit,
} from "lucide-react";
const nav = [
  ["/", "Обзор", LayoutDashboard],
  ["/subjects", "Предметы", BookOpen],
  ["/practice", "Практика", Target],
  ["/formulas", "Формулы", SquareFunction],
  ["/progress", "Мой прогресс", ChartNoAxesCombined],
  ["/leaderboard", "Рейтинг", Trophy],
  ["/profile", "Профиль", UserRound],
] as const;
export function Shell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const path = usePathname(),
    [open, setOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const value = localStorage.getItem("study-theme") === "dark";
      document.documentElement.dataset.theme = value ? "dark" : "light";
    } catch {
      /* Browser storage may be disabled; the default theme still works. */
    }
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  function theme() {
    const value = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = value ? "dark" : "light";
    try {
      localStorage.setItem("study-theme", value ? "dark" : "light");
    } catch {
      /* Keep the in-memory preference. */
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      {open && (
        <button
          className="nav-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Orbit size={25} />
          </span>
          studyspace<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">
          <span className="workspace-avatar">U</span>
          <div>
            Мой университет<small>Личное пространство</small>
          </div>
          <span className="workspace-chevron">⌄</span>
        </div>
        <div className="nav-label">ОБУЧЕНИЕ</div>
        <nav aria-label="Главная навигация">
          {nav.map(([href, label, Icon]) => (
            <Link
              onClick={() => setOpen(false)}
              key={href}
              href={href}
              className={`nav-item ${(href === "/" ? path === "/" : path.startsWith(href)) ? "active" : ""}`}
            >
              <Icon size={19} />
              {label}
              {href === "/practice" && <span className="nav-badge">5</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-spark">✦</span>
            <strong>
              Маленькие шаги.
              <br />
              Большое понимание.
            </strong>
            <p>
              Даже 10 минут практики
              <br />
              приближают к цели.
            </p>
            <Link href="/practice">
              Начать практику <ArrowUpRight size={14} />
            </Link>
          </div>
          <Link className="sidebar-user" href="/profile">
            <span className="avatar">{name[0]}</span>
            <span>
              {name}
              <small>Личный аккаунт</small>
            </span>
            <UserRound size={16} />
          </Link>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
          <form className="global-search" action="/search">
            <Search size={17} />
            <input
              ref={searchInput}
              aria-label="Поиск по предметам, темам и формулам"
              name="q"
              placeholder="Найти тему, формулу, термин…"
            />
            <kbd>
              <Command size={11} /> K
            </kbd>
          </form>
          <div className="topbar-actions">
            <span className="semester-label">Учиться. Понимать. Расти.</span>
            <button
              className="icon-button"
              onClick={theme}
              aria-label="Переключить тему"
            >
              <Sun size={19} className="theme-sun" />
              <Moon size={19} className="theme-moon" />
            </button>
            <form action="/api/auth/logout" method="post">
              <button className="icon-button" aria-label="Выйти">
                <LogOut size={18} />
              </button>
            </form>
            <Link href="/profile" className="avatar small" aria-label="Профиль">
              {name[0]}
            </Link>
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
          <footer className="page-footer">
            <span>
              studyspace <span className="muted">/</span> Здесь сложное
              становится понятным.
            </span>
            <span>Learn → Practice → Grow</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
