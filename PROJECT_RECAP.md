# StudySpace — краткий рекап проекта

Обновлено: 2026-10-07. Последняя завершённая задача: `dmitrij/feature/practice-builder-selection`.
Проверенная база: `origin/main` — `7f2ce7e`; человек слил контентный PR #4.

## Как пользоваться

Перед широким обзором читать этот файл, затем проверять `git status`, текущую ветку и изменения относительно указанной базы. По карте ниже открывать только нужную подсистему. При расхождениях доверять актуальным исходникам и проверкам, а сводку исправлять. Полный обход нужен только когда точечной проверки недостаточно.

После каждого законченного пакета изменений обновлять этот файл: что сделано, где, какие проверки реально прошли, что осталось и с чего продолжать. Не копировать сюда логи и полные отчёты. Не записывать секреты. Обязательные инструкции `AGENTS.md` сохраняют силу.

## Карта для точечного чтения

| Задача | Сначала открыть |
| --- | --- |
| Правила работы и запуск | `AGENTS.md`, `README.md`, `package.json`; роли — `agents/` |
| Практика: выбор, старт, ответы, сохранение | `src/lib/practice-service.ts`, `src/app/api/practice/`, `src/components/practice-setup.tsx`, `src/components/practice-builder.tsx`, `src/components/practice-runner.tsx`; тесты — `integration/`, `e2e/` |
| Выбор всех фильтров | `src/lib/filter-selection.ts`, `src/components/filter-select-all.tsx` |
| XP, mastery, GPA, прогресс, рейтинг | `src/lib/learning.ts`, `src/lib/progress.ts`, `tests/`, `integration/` |
| Telegram и сессии | `src/lib/telegram.ts`, `src/lib/auth.ts`, `src/lib/request-origin.ts`, `src/app/api/auth/` |
| Уроки и банк вопросов | `content/subjects.json`, `content/lessons/`, `content/questions/`, `src/lib/content-source.ts`, `src/lib/content-service.ts` |
| Программа и категории практики | `content/curriculum.json`, `content/practice-patterns.json`, `src/lib/curriculum.ts` |
| БД и загрузка контента | `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts` |

Это навигация по README и существующим путям, а не новый аудит реализации всех подсистем.

## Ограничения, которые сохраняем

- AI Tutor — только Coming soon; без AI API, ключей, чатов и генерации практики.
- Не переписывать рабочую архитектуру практики/авторизации ради контентных задач.
- Сохранять смысл существующих question ID и пользовательские результаты; материально новое задание получает новый ID.
- Для учебных изменений читать `STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md`; для расширения банка также `CONTENT_EXPANSION_PROGRESS.md`.
- Работать в отдельной ветке; не коммитить/пушить в `main`, не сливать PR автоматически. Prisma требует единственного владельца изменений.

## Завершённая задача — удобный выбор практики

- Ветка от main `7f2ce7e`; финальные fetch/merge 2026-10-07 — Already up to date. Коммиты `20c01d0` (UI/tests), `2b31a55` (research/QA/review), closure-docs опубликованы в task-ветке. [PR #5](https://github.com/gulTrueKanekiSSS/vibe_code/pull/5) открыт в main, **не слит**. Задача: `.tasks/done/practice-builder-selection.md`.
- Изучены первичные документы Quizlet Test, Khan Academy, Brilliant и NN/G; независимый UX обзор подтвердил одностраничное улучшение. Решение/ограничения: `.tasks/research/practice-builder-selection.md`; human usability study не проводился.
- `src/components/practice-builder.tsx`, scoped `src/app/globals.css`, `filter-select-all.tsx`: пресеты-карточки, поиск/группировка тем, удаляемый выбранный набор, разные global/found bulk actions, сводка и одно раскрытие advanced. Без wizard, новых режимов или изменений API/start/request-key/auth/БД/контента/AI.
- `src/lib/practice-topic-search.ts`, `tests/practice-topic-search.test.ts`, `e2e/practice-builder-selection.spec.ts`; прежний practice-start E2E уточнён для раскрытия advanced и однозначного checkbox locator. Поиск presentation-only; hidden selection/filters и пустой all-topics scope явно отражены.
- **51/51 unit,26/26 integration,5/5 новых +19/19 прежних E2E**, typecheck/lint/production build/Prisma validate/diff check PASS. Отдельный QA PASS и reviewer APPROVE; desktop/light/dark,390/320px, клавиатура, saved config/edit/retry/duplicates/reload проверены. Подробно: `.tasks/qa/practice-builder-selection.md`.
- Исправлены после прерывания fixture lint, доступные описания preset/предмета, search padding и тестовые locators; screenshot transitions/Chrome fullPage artifacts отделены от реальных ошибок. `.idea/`, env/secrets, build/screenshot artifacts не committed; generated `next-env.d.ts` исключён. Схема/seed/migrations не менялись, банк742/64 сохранён.
- Dev-сервер продолжает работать: `http://localhost:3000/practice/custom` после входа. Existing `/favicon.ico`404 вне scope; реальный Telegram login, remote deploy и unrelated full learning E2E не проверялись. Следующий шаг: ручной просмотр и review/merge человеком; не выполнять merge или deployment автоматически.

## Последний завершённый контентный пакет — минимум 10 заданий на тему

- Ветка: `dmitrij/content/ten-questions-per-topic`; актуальный `origin/main` `6a92406` интегрирован 2026-10-06.
- **742 вопроса (+390), все 64 темы >=10**. Было 352; все старые объекты/ID неизменны, 17 ранее полных тем не затронуты. Добавлены 47 файловых пакетов по пяти предметам.
- Основные пути: `content/questions/`, пять `tests/minimum-*.test.ts`, `tests/fixtures/minimum-baseline.json`, `tests/fixtures/minimum-programming.c`, `integration/minimum-topic-coverage.test.ts`; обновлены устаревшие ожидания integration/practice и e2e/practice-start.
- Все новые ответы/решения/подсказки независимо проверены; три reviewers APPROVE, независимый QA PASS. Исправлены неточная XOR-формулировка, integer/domain hypotheses, 42 завышенных уровня сложности новых заданий и TS-тип синтетического fixture.
- Текущие проверки: **48/48 unit, 26/26 integration, 19/19 practice-start E2E**, typecheck/lint без предупреждений, production build; content check 742/no numeric-template candidates; Prisma schema valid, пять миграций up to date. После fixes проверки повторены.
- Existing upsert seed загружает **5 subjects /64 topics /742 questions** в локальную настроенную БД; без reset. Для всех 64 тем проверены десятивопросные topic/custom сессии, ответ/повтор/reload; браузер — пять предметов и стартовые регрессии.
- App/auth/session/XP/curriculum/lessons/schema/migrations не менялись. Future/supplementary классификация сохранена. На каждую отдельную сложность/категорию десять вопросов не обещаются.
- Dev-сервер для просмотра: `http://localhost:3000`. Полный unrelated E2E и реальный Telegram login не проверялись; no deployment/remote DB updates.
- Сгенерированные build-правки `next-env.d.ts` исключены; чужая `.idea/` не тронута/не staged.
- Детальные счётчики и validation: [CONTENT_EXPANSION_PROGRESS.md](CONTENT_EXPANSION_PROGRESS.md). Закрытая задача: `.tasks/done/ten-questions-per-topic.md`; описание PR: `.tasks/pr/ten-questions-per-topic.md`.
- Коммиты `2e21172`, `4189218`, `8c2e49f`, `cd60937` опубликованы; [PR #4](https://github.com/gulTrueKanekiSSS/vibe_code/pull/4) **слит человеком** в main `7f2ce7e` (подтверждено Git 2026-10-06). GitHub API использован с existing Git auth без вывода credentials, настройка авторизации не менялась.
- Seed отдельно развёрнутого окружения выполняется отдельно по обычному workflow; эта UI-задача не обновляет remote DB и не расширяет банк.

## Историческая документация

Правило отдельного рекапа добавлено в `AGENTS.md` и этот файл коммитом `03fea2f`, затем слито человеком в main (PR #3, `6a92406`). При той работе код/контент/БД не менялись; карта путей и diff были проверены. Подробная история прежних контентных пакетов остаётся в CONTENT_EXPANSION_PROGRESS.md.
