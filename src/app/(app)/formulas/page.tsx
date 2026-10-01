import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeading, Empty } from "@/components/ui";
import { RichText, MathFormula } from "@/components/markdown";
import { StartPractice } from "@/components/actions";
export default async function Formulas({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string }>;
}) {
  const { q = "", subject = "" } = await searchParams;
  const [formulas, subjects] = await Promise.all([
    db.formula.findMany({
      where: {
        ...(subject ? { topic: { module: { subjectId: subject } } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { meaning: { contains: q, mode: "insensitive" } },
                { topic: { english: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        topic: { include: { module: { include: { subject: true } } } },
      },
      orderBy: { title: "asc" },
    }),
    db.subject.findMany({ orderBy: { order: "asc" } }),
  ]);
  return (
    <>
      <PageHeading
        eyebrow="ВСЁ НУЖНОЕ ПОД РУКОЙ"
        title="Книга формул"
        description="Не просто формула — её смысл, применение и пример."
      />
      <form className="filter-bar" action="/formulas">
        <div className="search-input">
          <Search size={18} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Название или английский термин"
            aria-label="Поиск формулы"
          />
        </div>
        <select name="subject" defaultValue={subject} aria-label="Предмет">
          <option value="">Все предметы</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <button className="button">Найти</button>
      </form>
      <div className="formula-grid">
        {formulas.map((f) => (
          <article className="card formula-card" key={f.id}>
            <span className="eyebrow">{f.topic.module.subject.title}</span>
            <h2>{f.title}</h2>
            <MathFormula latex={f.latex} />
            <p>{f.variables}</p>
            <details>
              <summary>Смысл и применение</summary>
              <RichText>{f.meaning}</RichText>
              <h4>Когда использовать</h4>
              <RichText>{f.whenToUse}</RichText>
              <h4>Пример</h4>
              <RichText>{f.example}</RichText>
              <h4>Частая ошибка</h4>
              <RichText>{f.mistake}</RichText>
            </details>
            <div className="formula-actions">
              <StartPractice mode="topic" topicId={f.topicId} secondary>
                Практика
              </StartPractice>
              <Link className="text-link" href={`/topics/${f.topicId}`}>
                К теме
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!formulas.length && (
        <Empty title="Формулы не найдены">
          Попробуй другой термин или убери фильтр предмета.
        </Empty>
      )}
    </>
  );
}
