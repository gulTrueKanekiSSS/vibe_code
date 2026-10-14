# StudySpace content contract

Read this file first for content-only ingestion; inspect only the target subject/topic
and supplied source material. No application-wide scan or content regeneration needed.
Authority: existing Zod schemas/parser in `src/lib/content-source.ts` plus strict
file checks in `scripts/content-validation.ts`. No PostgreSQL needed for these checks.

## Structure and IDs

- `content/subjects.json`: array of `{id,title,english,description,icon,color,modules}`.
  `modules` is an ordered array of unique, nonempty **titles**, not objects/IDs.
- Subject → Module → Topic. One `lessons/<subjectId>/<topicId>.mdx` defines one topic;
  one `questions/<subjectId>/<topicId>.json` contains its nonempty question array.
  There is no separate Lesson database entity; seed stores sections in `Topic.content`.
- IDs: lowercase ASCII letters/digits/hyphens (`^[a-z0-9-]+$`), stable forever.
  Topic/lesson IDs and question IDs are each globally unique across subjects.
  Prefer descriptive topic IDs and `<topicId>-<concept>-<variant>` question IDs.
- Module title must exactly match the subject registry. Seed derives module IDs as
  `<subjectId>-<zero-based-index>`: never reorder/rename modules casually.
  Packs cannot change subjects/modules; registry changes require a separate review.
- Lesson ID = filename stem = every question's `topicId`. Prerequisites reference
  existing topic IDs (including topics supplied together in the same pack).

## Lesson metadata and sections

Frontmatter is a **strict JSON object** between `---` lines, not general YAML.
Required fields: `id,title,english,subject,module` strings; `order` integer ≥0;
`difficulty` enum below; `estimatedMinutes` integer >0; `prerequisites,keywords`
string arrays; `quizAnswer` string. Unknown metadata fields are rejected.
Title/English/subject/module must not be blank. Use `quizAnswer:""` if no mini-quiz.

Required nonempty `##` sections: `Что это?` (more than 50 characters),
`Разберём на примере`, `Частая ошибка`. Duplicate section titles are rejected.
Use Russian explanations with English academic terminology. Add intuition, formal
definition, formulas, assumptions, university examples and connections when useful.
Sections are parsed as Markdown text, not executable MDX components. PDFs are external
source material only. Formula extraction uses `Формула и её смысл` with `$$...$$`.

Minimal valid lesson: `lessons/analysis/addition-example.mdx`:

```mdx
---
{
  "id": "addition-example",
  "title": "Сложение",
  "english": "Addition",
  "subject": "analysis",
  "module": "Действительные числа",
  "order": 20,
  "difficulty": "EASY",
  "estimatedMinutes": 5,
  "prerequisites": [],
  "keywords": ["addition"],
  "quizAnswer": "2"
}
---

## Что это?
Сложение (addition) для натуральных чисел объединяет количества двух непересекающихся групп предметов.

## Разберём на примере
Один предмет и ещё один предмет вместе дают два: $1+1=2$.

## Частая ошибка
Не считайте один и тот же предмет дважды: группы должны быть непересекающимися.
```

## Question contract

Every object requires `id,topicId,type,difficulty,prompt,options,answer,solution,hints,tags`.
`prompt` is nonblank; `options,tags` are string arrays (use `[]` when not applicable).
`feedback` is an optional string→string map. Unknown fields are rejected.
**There is no `explanation` field: `solution` is the explanation AND full worked solution**,
required for every type, at least 35 characters after trimming. Explain reasoning,
domain assumptions, every necessary step and why the answer follows, not just the result.
Exactly **three distinct nonblank progressive hints**: conceptual direction → rule/formula
→ solution strategy. First hint should not reveal the answer; full answer goes in `solution`.

Difficulties (lesson and question): `EASY`, `MEDIUM`, `HARD`, `CHALLENGE`.

| Type | `answer` format / `options` |
| --- | --- |
| `NUMERIC` | Finite numeric **string**, decimal dot; no units or expressions; options usually `[]` |
| `MULTIPLE_CHOICE` | Exact option string; at least two distinct nonblank options |
| `TRUE_FALSE` | Exact option string; exactly two distinct nonblank options (e.g. Верно/Неверно) |
| `MULTI_SELECT` | Nonempty array of distinct option strings; at least two options; order irrelevant |
| `STEPS` | Nonempty array of answers in order; `options` are field labels, one per answer, not choices |
| `SHORT_TEXT`, `CONCEPTUAL` | Nonblank string or nonempty array of accepted alternative strings |
| `OUTPUT`, `FIX_CODE` | String or alternative strings; whitespace trimmed at edges, exact internal text/case |

Text/choice grading uses existing normalization; author exact expected strings instead of
assuming semantic/AI grading. Numeric grading accepts tolerance, but store an unambiguous number.
All array answers must contain nonblank strings. Options must be unique. Question prompts
must be globally unique after lowercasing/whitespace normalization; number-only variants
are reported heuristically, not proof of useful variety. Humans must validate correctness,
units/domains, teaching quality and originality; structural checks cannot prove them.

Minimal question file `questions/analysis/addition-example.json`:

```json
[
  {
    "id": "addition-example-count",
    "topicId": "addition-example",
    "type": "NUMERIC",
    "difficulty": "EASY",
    "prompt": "У тебя один карандаш, тебе дали ещё один. Сколько карандашей теперь?",
    "options": [],
    "answer": "2",
    "solution": "Объединяем две непересекающиеся группы: один карандаш и ещё один. Считаем их вместе: 1 + 1 = 2 карандаша.",
    "hints": ["Подумай о двух группах предметов.", "Для объединения количеств используй сложение.", "Сосчитай сначала свой карандаш, затем добавленный."],
    "tags": ["addition"]
  }
]
```

## Packs and commands

See `content-packs/README.md` for the manifest, safe import and recovery workflow.
`npm run content:validate` validates the complete file bank (metadata, enums, teaching
fields, IDs, references, matched lesson/bank pairs, duplicate prompts, prerequisites).
`npm run content:report` prints lessons/questions by subject, questions by topic,
difficulty/type and low coverage (<10). `content:check` remains a report alias.
Import does not publish to the DB. Review the diff and checks before a separately
authorized `npm run db:seed` against the intended database; never reset a shared DB.
