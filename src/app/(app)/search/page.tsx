import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { searchContent } from "@/lib/content-service";
import { PageHeading, Empty } from "@/components/ui";
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams,
    query = q.trim().slice(0, 200);
  const {topics,subjects,formulas}=await searchContent(query);
  const results = [
    ...subjects
      .map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: "Предмет · " + s.english,
        href: `/subjects/${s.id}`,
      })),
    ...topics
      .map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.module.subject.title + " · " + t.english,
        href: `/topics/${t.id}`,
      })),
    ...formulas
      .map((f) => ({
        id: f.id,
        title: f.title,
        subtitle: "Формула",
        href: `/formulas?q=${encodeURIComponent(f.title)}`,
      })),
  ];
  return (
    <>
      <PageHeading
        title="Поиск по знаниям"
        description="Ищи по-русски или по-английски: темы, предметы, формулы и термины."
      />
      <form className="filter-bar" action="/search">
        <div className="search-input">
          <Search size={18} />
          <input
            name="q"
            defaultValue={q}
            aria-label="Поисковый запрос"
            placeholder="supremum, указатель, dot product…"
          />
        </div>
        <button className="button">Найти</button>
      </form>
      {results.length ? (
        <div className="card">
          {results.map((r) => (
            <Link className="topic-row" href={r.href} key={r.id}>
              <Search size={17} />
              <div className="topic-name">
                <strong>{r.title}</strong>
                <small>{r.subtitle}</small>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      ) : (
        <Empty title={query ? "Ничего не найдено" : "Что хочется понять?"}>
          {query
            ? "Попробуй другой термин или его перевод."
            : "Например: projection, supremum или указатели."}
        </Empty>
      )}
    </>
  );
}
