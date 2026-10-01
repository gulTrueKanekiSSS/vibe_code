import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">404</span>
      <h1>Такой страницы пока нет</h1>
      <p>Вернёмся к знакомым темам?</p>
      <Link className="button" href="/subjects">
        К предметам
      </Link>
    </main>
  );
}
