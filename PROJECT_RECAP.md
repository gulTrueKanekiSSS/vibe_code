# StudySpace — navigation cache

Обновлено: 2026-10-10. Задача/ветка: `dmitrij/fix/unfinished-practice-controls`.
Проверенная база: `origin/main 36a7add` (PR #7 слит человеком; Git проверен).
Использовать для выбора путей, затем сверять Git и исходники; это не доказательство актуальности проверок.

## Карта подсистем — искать, затем открывать

| Подсистема | Entry points | Проверки / подробности |
| --- | --- | --- |
| Запуск / команды | `package.json`; нужный раздел `README.md` | Node 22.13+, PostgreSQL |
| UI / страницы | `src/app/(app)/`, `src/components/`, `src/app/globals.css` | роль Frontend; точечные E2E |
| Выбор практики | `src/components/practice-builder.tsx`, `practice-setup.tsx`; `src/lib/practice-topic-search.ts`, `filter-selection.ts` | `tests/practice-topic-search.test.ts`, `e2e/practice-builder-selection.spec.ts` |
| Старт / ответы / resume | `src/app/api/practice/`, `src/lib/practice-service.ts`, `src/components/practice-runner.tsx` | `integration/practice.test.ts`, `e2e/practice-start.spec.ts` |
| Незавершённые / досрочное завершение | `src/components/unfinished-practice.tsx`, `finish-practice.tsx`; `/practice`, `/practice/[id]`; `finishPractice` | `integration/practice-finish.test.ts`, `e2e/practice-finish.spec.ts` |
| XP / mastery / GPA / рейтинг | `src/lib/learning.ts`, `src/lib/progress.ts` | точечные `tests/` и `integration/` |
| Telegram / сессии / privacy | `src/lib/telegram.ts`, `auth.ts`, `request-origin.ts`; `src/app/api/auth/` | роль Backend; auth/integration tests |
| AI Tutor V1 | `src/components/tutor-panel.tsx`, `src/app/api/tutor/route.ts`; `src/lib/tutor-context.ts`, `tutor-service.ts`, `tutor/` | `tests/tutor.test.ts`, `integration/tutor*.test.ts`, `e2e/tutor.spec.ts`; `scripts/index-tutor.ts` |
| Уроки / вопросы | `content/subjects.json`, `content/lessons/`, `content/questions/`; `src/lib/content-source.ts`, `content-service.ts` | роль Content; `npm run content:check` |
| Curriculum / категории | `content/curriculum.json`, `content/practice-patterns.json`, `src/lib/curriculum.ts` | нужные разделы content master |
| БД / seed | `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts` | роль Database только при влиянии на БД |

В таблице сокращённые имена относятся к предыдущему каталогу той же ячейки.
Tracked-файлы — основной scope; новые релевантные пути проверять через Git status. Generated-папки не обходить.

## Решения и границы

- Next.js App Router; Prisma/PostgreSQL. Контент в JSON/MDX, загрузка через существующий seed; страницы не переписываются ради новых лекций.
- Telegram: OIDC Authorization Code + PKCE, проверка payload/token на сервере, серверные сессии. Secrets и защищённые ответы не уходят в клиент.
- Практика сохраняет сессии; start/retry идемпотентны, XP/mastery/GPA рассчитываются сервером. Не заменять рабочую архитектуру ради контентных/UI задач.
- AI Tutor V1 явно разрешён новой задачей: серверный provider, своя история, индекс опубликованных lesson sections; deterministic practice/mastery/GPA не меняются. PDF остаются исходниками для внешнего преобразования.
- До раскрытия решения Tutor упражнения возвращает только проверенные coaching actions. Незавершённые exam/delayed/no-hints блокируют Tutor во всех контекстах; сырые ответы модели не стримятся.
- PostgreSQL без pgvector: embeddings в float arrays, bounded subject retrieval; ключи/модели только server env. Индексация после seed через `npm run tutor:index`; `-- --embeddings` явно включает платные embedding-вызовы.
- Safety/workflow — `AGENTS.md`; подробности читаются по роли/этапу, не все сразу.

## Недавно завершённые области (исторические результаты)

- Выбор практики: карточки-пресеты, поиск/группы тем, выбранный scope, advanced и сводка; API/auth/БД не менялись. [Задача](.tasks/done/practice-builder-selection.md), [UX](.tasks/research/practice-builder-selection.md), [QA](.tasks/qa/practice-builder-selection.md). PR #5 слит в `353fa03`.
- Банк: 5 предметов / 64 темы / 742 вопроса; все темы >=10, старые ID/объекты сохранены. [Счётчики и validation](CONTENT_EXPANSION_PROGRESS.md), [задача](.tasks/done/ten-questions-per-topic.md). PR #4 слит в `7f2ce7e`. README содержит старые счётчики; для expansion сверять progress и текущий content report.
- Прежние app-проверки находятся в связанных QA/task отчётах; они не означают, что текущий worktree прошёл новые проверки. История рекапа — Git / PR #3 (`6a92406`), не копировать её сюда.

## Текущая задача / exact next step

- Инструкции готовы: root 99 строк, роли подключаются условно; один skill `git-task-workflow` с отдельными start/finalize references. [Закрытая задача](.tasks/done/agent-context-routing.md).
- [PR #6](https://github.com/gulTrueKanekiSSS/vibe_code/pull/6) слит человеком; прежний [QA инструкций](.tasks/qa/agent-context-routing.md) — исторический результат.
- [AI Tutor task/PM/Tech Lead](.tasks/done/contextual-ai-tutor.md): готовы contextual drawer, owned persisted turns, leases/idempotency/quotas, safe context, provider, chunk/index/retrieval, unit/integration/E2E. Auth, scoring и question bank не переписывались.
- Additive migration `20261008120000_contextual_ai_tutor` применена только локально; Prisma generate/validate/status и DB/schema diff PASS, прежние учебные таблицы сохранены. Deploy требует этой миграции перед новым кодом.
- Проверки: typecheck/lint/build PASS; unit 62/62, integration 40/40, финальные Tutor E2E 9/9 и прежние 3 practice regressions PASS. [QA](.tasks/qa/contextual-ai-tutor.md), [Review APPROVE](.tasks/qa/contextual-ai-tutor-review.md). Исправлены focus trap, Markdown external-image leak и retry после 4xx. AI-текст в E2E подставной; live-вызовов нет.
- Локальный text index: 64 темы / 505 chunks / 0 новых embeddings. README содержит env/index/live smoke инструкции и ограничения V1.
- [PR #7](https://github.com/gulTrueKanekiSSS/vibe_code/pull/7) слит человеком в `36a7add`. Live-проверка после настройки AI env/embeddings остаётся отдельным шагом; merge не означает production deployment.
- [Завершённая задача](.tasks/done/unfinished-practice-controls.md): старые protected-сессии скрывались за `take: 3`, блокируя Tutor. Добавлены полный доступный список, продолжение/подтверждаемое досрочное закрытие, ссылка из Tutor, честный summary незавершённых заданий. Без схемы/миграций; реальные пользовательские сессии не закрывались автоматически.
- Сервер: только `finishedAt`, owner check + user lock, идемпотентность, запрет новых answer/hint после закрытия. Незавершённые items не превращаются в assessment. Проверки PASS: typecheck/lint/build, unit62, integration48 (8 новых), E2E15 (6 finish + 9 Tutor). [QA](.tasks/qa/unfinished-practice-controls.md), [Review APPROVE](.tasks/qa/unfinished-practice-controls-review.md); focus и неоднозначный старый Tutor test locator исправлены. Main sync `36a7add` без конфликтов. Implementation `3e9a6b4` отправлен; [PR #8](https://github.com/gulTrueKanekiSSS/vibe_code/pull/8) открыт, не слит. Exact next step: human review/merge; старую сессию пользователь закрывает сам через интерфейс.

## Ограничения

Реальный Telegram login и remote deployment прежними QA не проверялись; dev-auth не является их доказательством.
Уровень >=10 обещан на тему, не на каждую отдельную difficulty/category. Human usability study не проводился.
Ранее отмечен unrelated favicon 404; актуальность процесса dev-сервера надо проверять перед запуском, не считать его живым по этой сводке.
Чужая untracked `.idea/` не относится к задаче; не stage/удалять. Никаких remote DB/seed/deployment действий.
AI credentials отсутствуют: реальные генерация/embeddings и педагогическое качество не проверены. История bounded (12 сообщений/9 KB контекста), не долговременная модель знаний; свободное объяснение доступно в уроках и после разрешённого раскрытия решения.
