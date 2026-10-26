# StudySpace — navigation cache

2026-10-26 CA Week3 import: `dmitrij/content/ca-week3-theory-exam`, base/current
origin/main `b87b526`; isolated `/private/tmp/studyspace-ca-week3`. +11 architecture
lessons/+425 authored questions (210 MC,178 numeric,37 true/false). No collisions;
ZIP/lesson/question parity PASS; prior content unchanged. Validator/report PASS:
5 subjects/84 lessons/1276 questions; architecture23/569; low coverage empty;
unit91/91 PASS. Source README/QA preserved under content-packs/references because
importer rejects auxiliary inbox entries. No app/schema/DB/production operations.
[Task](.tasks/active/ca-week3-theory-exam.md). Independent review APPROVE; local
content commit `14da887` pushed to origin by user request; PR not created.
Next: human review; deployment/production seed
require separate authorization.

Обновлено: 2026-10-26. Задача/ветка: `dmitrij/content/agla-lecture-5-lab-5`.
База `origin/main c7a2f2a`; PR #14 (Neon Lab 6 publication) уже слит человеком.
Использовать для выбора путей, затем сверять Git и исходники; это не доказательство актуальности проверок.

## Карта подсистем — искать, затем открывать

| Подсистема | Entry points | Проверки / подробности |
| --- | --- | --- |
| Запуск / команды | `package.json`; нужный раздел `README.md` | Node 22.13+, PostgreSQL |
| Hosting Vercel + Neon | `vercel.json`, `scripts/hosting-config.ts`, `docs/HOSTING.md` | `tests/hosting.test.ts`; Node 22.x; preflight → Prisma generate → build, без DB writes |
| UI / страницы | `src/app/(app)/`, `src/components/`, `src/app/globals.css` | роль Frontend; точечные E2E |
| Выбор практики | `src/components/practice-builder.tsx`, `practice-setup.tsx`; `src/lib/practice-topic-search.ts`, `filter-selection.ts` | `tests/practice-topic-search.test.ts`, `e2e/practice-builder-selection.spec.ts` |
| Старт / ответы / resume | `src/app/api/practice/`, `src/lib/practice-service.ts`, `src/components/practice-runner.tsx` | `integration/practice.test.ts`, `e2e/practice-start.spec.ts` |
| Незавершённые / досрочное завершение | `src/components/unfinished-practice.tsx`, `finish-practice.tsx`; `/practice`, `/practice/[id]`; `finishPractice` | `integration/practice-finish.test.ts`, `e2e/practice-finish.spec.ts` |
| XP / mastery / GPA / рейтинг | `src/lib/learning.ts`, `src/lib/progress.ts` | точечные `tests/` и `integration/` |
| Telegram / сессии / privacy | `src/lib/telegram.ts`, `auth.ts`, `request-origin.ts`; `src/app/api/auth/` | роль Backend; auth/integration tests |
| AI Tutor V1 | `src/components/tutor-panel.tsx`, `src/app/api/tutor/route.ts`; `src/lib/tutor-context.ts`, `tutor-service.ts`, `tutor/` | `tests/tutor.test.ts`, `integration/tutor*.test.ts`, `e2e/tutor.spec.ts`; `scripts/index-tutor.ts` |
| Уроки / вопросы | `content/subjects.json`, `content/lessons/`, `content/questions/`; `src/lib/content-source.ts`, `content-service.ts` | роль Content; `npm run content:check` |
| Импорт готового контента | `CONTENT_SCHEMA.md`, `content-packs/README.md`; `scripts/content-validation.ts`, `content-pack.ts` | DB-free `content:validate`, `content:import`, `content:report`; `tests/content-validation.test.ts`, `content-import.test.ts` |
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

- [AGLA Lecture 5 / Lab 5](.tasks/active/agla-lecture-5-lab-5.md): prepared content
  imported under geometry / `Матрицы и пространство`; +5 lessons / +69 questions.
  Source inbox and receipt preserved. On fresh `origin/main c7a2f2a`, validate/report
  PASS (5 subjects / 73 lessons / 851 questions; no low coverage topics), unit91/91;
  seed source uses upsert only. Current next step: PR to documented production branch
  `main`; commit `7ac1afa` pushed. PR creation needs GitHub web UI:
  [open PR form](https://github.com/gulTrueKanekiSSS/vibe_code/pull/new/dmitrij/content/agla-lecture-5-lab-5).
  Local Vercel project/auth unavailable, so deployment/Neon identity and backup are
  unverified. No DB/index/live-site operations until Ready Production is confirmed.

- [Production Lab 6](.tasks/done/neon-lab6-publication.md): явно разрешённый seed
  Neon завершён. Production **5 предметов / 68 уроков / 782 вопроса**, четыре новые
  темы по 10 заданий. TLS/preflight/6 migration checksums/backup/seed/full content
  parity PASS; снимки всех user/auth/practice/progress/Tutor данных совпали до/после.
  Backup pg_dump18.6 закрыт и вне Git; путь и ограничения в task (временное хранение,
  restore не репетировался). Для backup установлен libpq18.6 с зависимостями.
  Happ direct-исключения восстановили доступ; IP могут меняться. Без app/env/schema
  изменений, миграций, AI/index calls. Отчёт отправлен, [PR #14](https://github.com/gulTrueKanekiSSS/vibe_code/pull/14)
  открыт (только документация, не слит). Next: ручной smoke новых тем на сайте и
  human review отчёта; seed повторять не нужно. Tutor остаётся отключён.

- [Первый реальный pack — ma-lab-6](.tasks/done/content-ingestion-lab6.md): файлы и
  локальная БД теперь 5 предметов / 68 уроков / 782 вопроса. Четыре новые analysis темы,
  по 10 разных заданий; прежние 742 вопроса неизменны. Raw pack/receipt сохранены.
  После review уточнены две новые лекции и два solution в одном банке (unit circle,
  principal arcosh branch); ID/вопросы/ответы не менялись. Повтор исходного pack намеренно
  не перезапишет reviewed-исправления; подробности в task/report.
  Coverage tests обходят все темы без фиксированного count, integration learner на тему.
  [QA](.tasks/qa/content-ingestion-lab6.md): validate/report, typecheck/lint, unit91/91,
  integration48/48, db:generate/prisma validate/build PASS. Seed — только local,
  пользовательские данные до/после совпали; DB/full-source parity PASS.
  `tutor:index`: 68 тем / 525 chunks / 0 embeddingsCreated, внешних AI-вызовов нет.
  [Независимое review](.tasks/qa/content-ingestion-lab6-review.md) APPROVE с закрытием
  двух замечаний. Полная матрица проверок повторена после merge main — PASS.
  Ветка отправлена; [PR #13](https://github.com/gulTrueKanekiSSS/vibe_code/pull/13)
  слит человеком в `c4ddcaf`. Production seed завершён отдельной задачей выше;
  Tutor index выполнен только локально, Tutor остаётся отключён.

- [Content ingestion](.tasks/done/content-ingestion.md): добавлены компактная схема,
  DB-free validator/report, additive importer с ID/conflict/lock/rollback защитой и
  success receipt. Банк 5/64/742 не менялся; импорт не запускает seed/AI/сеть.
  [QA](.tasks/qa/content-ingestion.md): unit91/91, integration48/48 (local), typecheck,
  lint/build/validate/report PASS после sync a73033a. [Review](.tasks/qa/content-ingestion-review.md):
  независимая проверка кода/12 тестов без blockers; final gate закрыт root после лимита агентов.
  При аварийном kill — ручное recovery по lock/journal; математику проверяет человек.
  `6709ee3` отправлен; [PR #12](https://github.com/gulTrueKanekiSSS/vibe_code/pull/12)
  слит человеком в `81aacc0`. Пайплайн готов; первая реальная партия описана выше.

- [Инициализация Neon](.tasks/active/neon-initialization.md): пользователь создал Free
  production во Frankfurt и приватно добавил direct URL в ignored `.env.hosting.local`.
  После отключения VPN соединение заработало: пустота public проверена, внешний TLS
  сертификат PASS. Prisma validate/migrate deploy/status PASS; 6 checksums совпадают.
  Seed + read-only counts PASS: 5 предметов / 15 модулей / 64 темы / 742 вопроса,
  везде >=10; пользователей/сессий/Tutor history/chunks нет. AI-вызовов не было.
  Exact next step: Vercel import main, production-only pooled URL/Telegram/env,
  DEV_AUTH=false, TUTOR_PROVIDER=disabled, стабильный origin/callback и real smoke.
  Миграции/seed повторять ради deployment НЕ нужно. Доступа к Vercel аккаунту пока нет.

- [Подготовка хостинга](.tasks/active/hosting-readiness.md): Vercel + Neon free pilot,
  Tutor отложен пользователем. `TUTOR_PROVIDER=disabled` в hosting env, AI-ключи не
  переносить. Добавлены preflight без вывода значений, build config, env ignore,
  runbook миграций/seed отдельным процессом с direct DB URL, изоляция preview.
  Schema/auth/practice/UI не менялись. Unit79/79, hosting3/3, lint и production
  `build:hosting` PASS на синтетических реквизитах; реальной cloud DB нет.
  Typecheck/lint после build PASS; независимые QA PASS/review APPROVE.
  `baa914c` отправлен; [PR #10](https://github.com/gulTrueKanekiSSS/vibe_code/pull/10)
  слит человеком в `3a55ff6`. Подготовка репозитория завершена, deployment ещё нет.
  Neon подготовлен отдельным шагом выше. Next: настроить Vercel production env/Telegram
  и реальный smoke. Remote site deploy/Telegram/network проверки НЕ выполнены.

- [Tutor для России](.tasks/done/tutor-yandex.md): добавлен native Yandex adapter,
  общие provider safety helpers, document/query embeddings purpose и отдельная
  идентичность пары моделей; `.env.example` и README обновлены. Реальный `.env`
  не менялся. OpenAI сохранён без автоматического fallback; UI/auth/schema/scoring
  без изменений. Проверки PASS: unit76/76 (14 новых Yandex), integration48/48,
  typecheck/lint/build; после sync `c538d03` — typecheck и provider23/23 PASS.
  Длинные embedding-тексты объединяются weighted mean из частей <=1800 bytes;
  качество требует live оценки. [QA](.tasks/qa/tutor-yandex.md),
  [Review APPROVE](.tasks/qa/tutor-yandex-review.md). Implementation `dcaed23` отправлен;
  [PR #9](https://github.com/gulTrueKanekiSSS/vibe_code/pull/9) слит человеком в `c51e58b`.
  После resume: sync без изменений, provider23/23 PASS. Подготовлен
  [пилот из 20 проверок](.tasks/qa/tutor-yandex-live-pilot.md), NOT RUN.
  Позже env настроен пользователем; минимальный live-запрос вернул HTTP403.
  Пользователь отложил Tutor: не повторять платные вызовы/индексацию без новой задачи.

- Инструкции готовы: root 99 строк, роли подключаются условно; один skill `git-task-workflow` с отдельными start/finalize references. [Закрытая задача](.tasks/done/agent-context-routing.md).
- [PR #6](https://github.com/gulTrueKanekiSSS/vibe_code/pull/6) слит человеком; прежний [QA инструкций](.tasks/qa/agent-context-routing.md) — исторический результат.
- [AI Tutor task/PM/Tech Lead](.tasks/done/contextual-ai-tutor.md): готовы contextual drawer, owned persisted turns, leases/idempotency/quotas, safe context, provider, chunk/index/retrieval, unit/integration/E2E. Auth, scoring и question bank не переписывались.
- Additive migration `20261008120000_contextual_ai_tutor` применена только локально; Prisma generate/validate/status и DB/schema diff PASS, прежние учебные таблицы сохранены. Deploy требует этой миграции перед новым кодом.
- Проверки: typecheck/lint/build PASS; unit 62/62, integration 40/40, финальные Tutor E2E 9/9 и прежние 3 practice regressions PASS. [QA](.tasks/qa/contextual-ai-tutor.md), [Review APPROVE](.tasks/qa/contextual-ai-tutor-review.md). Исправлены focus trap, Markdown external-image leak и retry после 4xx. AI-текст в E2E подставной; live-вызовов нет.
- Локальный text index: 64 темы / 505 chunks / 0 новых embeddings. README содержит env/index/live smoke инструкции и ограничения V1.
- [PR #7](https://github.com/gulTrueKanekiSSS/vibe_code/pull/7) слит человеком в `36a7add`. Live-проверка после настройки AI env/embeddings остаётся отдельным шагом; merge не означает production deployment.
- [Завершённая задача](.tasks/done/unfinished-practice-controls.md): старые protected-сессии скрывались за `take: 3`, блокируя Tutor. Добавлены полный доступный список, продолжение/подтверждаемое досрочное закрытие, ссылка из Tutor, честный summary незавершённых заданий. Без схемы/миграций; реальные пользовательские сессии не закрывались автоматически.
- Сервер досрочного завершения: только `finishedAt`, owner check + user lock, идемпотентность, запрет новых answer/hint после закрытия. Исторические проверки: typecheck/lint/build, unit62, integration48, E2E15. [QA](.tasks/qa/unfinished-practice-controls.md), [Review APPROVE](.tasks/qa/unfinished-practice-controls-review.md). [PR #8](https://github.com/gulTrueKanekiSSS/vibe_code/pull/8) слит человеком в `c538d03`; реальные сессии пользователь завершает сам через интерфейс.

## Ограничения

Реальный Telegram login и remote deployment прежними QA не проверялись; dev-auth не является их доказательством.
Уровень >=10 обещан на тему, не на каждую отдельную difficulty/category. Human usability study не проводился.
Ранее отмечен unrelated favicon 404; актуальность процесса dev-сервера надо проверять перед запуском, не считать его живым по этой сводке.
Чужая untracked `.idea/` не относится к задаче; не stage/удалять. Neon migration/seed выполнены по явному запросу, remote site deployment ещё нет.
Локальные AI credentials заданы приватно; live генерация заблокирована HTTP403, embeddings и педагогическое качество не проверены. Tutor отложен; в hosting env отключён. История bounded (12 сообщений/9 KB контекста), не долговременная модель знаний; свободное объяснение доступно в уроках и после разрешённого раскрытия решения.
