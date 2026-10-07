# StudySpace — navigation cache

Обновлено: 2026-10-07. Задача/ветка: `dmitrij/chore/agent-context-routing`.
Проверенная база: `origin/main 353fa03` (PR #5 слит человеком; Git проверен).
Использовать для выбора путей, затем сверять Git и исходники; это не доказательство актуальности проверок.

## Карта подсистем — искать, затем открывать

| Подсистема | Entry points | Проверки / подробности |
| --- | --- | --- |
| Запуск / команды | `package.json`; нужный раздел `README.md` | Node 22.13+, PostgreSQL |
| UI / страницы | `src/app/(app)/`, `src/components/`, `src/app/globals.css` | роль Frontend; точечные E2E |
| Выбор практики | `src/components/practice-builder.tsx`, `practice-setup.tsx`; `src/lib/practice-topic-search.ts`, `filter-selection.ts` | `tests/practice-topic-search.test.ts`, `e2e/practice-builder-selection.spec.ts` |
| Старт / ответы / resume | `src/app/api/practice/`, `src/lib/practice-service.ts`, `src/components/practice-runner.tsx` | `integration/practice.test.ts`, `e2e/practice-start.spec.ts` |
| XP / mastery / GPA / рейтинг | `src/lib/learning.ts`, `src/lib/progress.ts` | точечные `tests/` и `integration/` |
| Telegram / сессии / privacy | `src/lib/telegram.ts`, `auth.ts`, `request-origin.ts`; `src/app/api/auth/` | роль Backend; auth/integration tests |
| Уроки / вопросы | `content/subjects.json`, `content/lessons/`, `content/questions/`; `src/lib/content-source.ts`, `content-service.ts` | роль Content; `npm run content:check` |
| Curriculum / категории | `content/curriculum.json`, `content/practice-patterns.json`, `src/lib/curriculum.ts` | нужные разделы content master |
| БД / seed | `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts` | роль Database только при влиянии на БД |

В таблице сокращённые имена относятся к предыдущему каталогу той же ячейки.
Tracked-файлы — основной scope; новые релевантные пути проверять через Git status. Generated-папки не обходить.

## Решения и границы

- Next.js App Router; Prisma/PostgreSQL. Контент в JSON/MDX, загрузка через существующий seed; страницы не переписываются ради новых лекций.
- Telegram: OIDC Authorization Code + PKCE, проверка payload/token на сервере, серверные сессии. Secrets и защищённые ответы не уходят в клиент.
- Практика сохраняет сессии; start/retry идемпотентны, XP/mastery/GPA рассчитываются сервером. Не заменять рабочую архитектуру ради контентных/UI задач.
- AI Tutor — только Coming soon; PDF — исходники для внешнего преобразования. Существующие question IDs сохраняют смысл.
- Safety/workflow — `AGENTS.md`; подробности читаются по роли/этапу, не все сразу.

## Недавно завершённые области (исторические результаты)

- Выбор практики: карточки-пресеты, поиск/группы тем, выбранный scope, advanced и сводка; API/auth/БД не менялись. [Задача](.tasks/done/practice-builder-selection.md), [UX](.tasks/research/practice-builder-selection.md), [QA](.tasks/qa/practice-builder-selection.md). PR #5 слит в `353fa03`.
- Банк: 5 предметов / 64 темы / 742 вопроса; все темы >=10, старые ID/объекты сохранены. [Счётчики и validation](CONTENT_EXPANSION_PROGRESS.md), [задача](.tasks/done/ten-questions-per-topic.md). PR #4 слит в `7f2ce7e`. README содержит старые счётчики; для expansion сверять progress и текущий content report.
- Прежние app-проверки находятся в связанных QA/task отчётах; они не означают, что текущий worktree прошёл новые проверки. История рекапа — Git / PR #3 (`6a92406`), не копировать её сюда.

## Незавершённый handoff / exact next step

- Инструкции готовы: root 99 строк, роли подключаются условно; один skill `git-task-workflow` с отдельными start/finalize references. [Задача: publication blocked](.tasks/active/agent-context-routing.md).
- Сделано после прерывания: проверены Git/diff и процессы; зависших операций изменения не обнаружено. Готовые изменения сохранены, skill дописан.
- Проверки: структурная/path/scope validation, byte-identical Next.js block, skill validator и diff check PASS; независимые QA PASS / Reviewer APPROVE. [Отчёт и структура](.tasks/qa/agent-context-routing.md). App tests/lint/typecheck/build/DB commands для docs-only diff не запускались.
- Main: `353fa03`, Already up to date. `abca807` опубликован; [PR #6](https://github.com/gulTrueKanekiSSS/vibe_code/pull/6) открыт, не слит. Push локального handoff `9bb889b` трижды отклонён GitHub: Internal Server Error. Следующий шаг: сверить HEAD/remote ref, повторить обычный push после восстановления GitHub, затем закрыть task/опубликовать closure. Force/auth/history не менять; реализация готова. Токены не benchmarked, skill имеет direct-path fallback.

## Ограничения

Реальный Telegram login и remote deployment прежними QA не проверялись; dev-auth не является их доказательством.
Уровень >=10 обещан на тему, не на каждую отдельную difficulty/category. Human usability study не проводился.
Ранее отмечен unrelated favicon 404; актуальность процесса dev-сервера надо проверять перед запуском, не считать его живым по этой сводке.
Чужая untracked `.idea/` не относится к задаче; не stage/удалять. Никаких remote DB/seed/deployment действий в этой docs-задаче.
