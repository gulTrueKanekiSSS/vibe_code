# Groq Tutor V1 — QA

Status: PASS
Date: 2026-11-03
Branch: `dmitrij/feature/tutor-groq`
Base/latest main: `ebfddac`
Verifier: independent `groq_review`; implementation/check operator: root.

## Acceptance and evidence

| Requirement | Result / evidence |
| --- | --- |
| Optional provider/configuration | PASS: explicit `groq`, own key, default `openai/gpt-oss-120b`, safe model/config parsing, missing key/invalid config disabled; existing OpenAI/Yandex selection preserved. |
| Structured requests/responses | PASS: fixed HTTPS chat endpoint, server Authorization header, strict existing guided/teaching JSON schemas, Zod validation, single completed assistant choice, bounded input/history/response and timeout. Invalid, refused and truncated output rejected safely. |
| Free retrieval | PASS: Groq has no embedding endpoint; empty embedding identity explicitly bypasses query embeddings; existing lexical course chunks/indexing retained. |
| Citations/learning protections | PASS: existing Russian teaching instructions reused, citations resolved by server; invented IDs rejected; general knowledge marked; restricted output only selects a validated coaching action. |
| Global budget | PASS: PostgreSQL atomic reservation shared across users/processes/models; zero denies calls; fixed UTC minute/day windows; failed calls count; stale/backward timestamps cannot rewind counters; DB errors fail closed. |
| Quota UX/cost controls | PASS: local cap and HTTP429 persist a friendly failed-turn message; normal practice remains usable; no retries, paid fallback or embedding service. |
| Auth/isolation/exams | PASS: private owned/idempotent history and cross-user exercise checks; unfinished exam/delayed/no-hints protections retained, including post-provider recheck; browser anonymous/origin/body-validation checks pass. |
| Scope | PASS: only provider/quota/service/retrieval wiring, additive schema/migration, tests and docs; no content, UI, route/auth strategy, scoring/XP/GPA/mastery or existing migration changes. |

## Executed checks

All application/database checks used the isolated worktree and disposable local
PostgreSQL 16 database `127.0.0.1:55437/studyspace_groq_test`. HTTP provider
responses are mocked; no actual Groq/OpenAI/Yandex quota was consumed.

| Check | Result | Executor / evidence |
| --- | --- | --- |
| `npm run db:generate`, Prisma validate | PASS | Root-run successful output; generated client stays untracked. |
| Local migrate deploy + seed | PASS, seven migrations; 5 subjects / 93 topics / 1372 questions | Root-run on disposable DB only; additive quota migration reviewed. |
| Migration status / schema diff | PASS, seven applied / no difference | Root-reported final local check. |
| `npm run typecheck` | PASS | Root-run final check. |
| `npm run lint` | PASS | Root-run final check. |
| `npm test` | PASS 101/101, zero failures/skips | Root-run final log independently inspected: `/private/tmp/tutor-groq-unit-final.log`. |
| `npm run test:integration` | PASS 56/56, including eight new Groq cases and all 48 existing cases | Root-run final log independently inspected: `/private/tmp/tutor-groq-full-integration.log`. |
| Targeted Tutor integration | PASS 22/22 | Root-run, including cross-process quota races, backwards clock, lexical retrieval, citations, user isolation and exam safety. |
| `npm run test:e2e -- e2e/tutor.spec.ts` | PASS 9/9 | Root-run final log independently inspected: `/private/tmp/tutor-groq-e2e.log`; browser UI mocks plus real local auth/origin/protected-session routes. |
| `npm run build` | PASS, compilation/type checking/static-page generation complete | Root-run final log independently inspected: `/private/tmp/tutor-groq-build.log`. |
| Groq/OpenAI/Yandex provider tests | PASS 33/33 | Reviewer independently executed the three mocked provider test files. |
| Isolated suite outside dedicated DB | SKIP, exit0, no test/DB work | Reviewer independently used an unreachable ordinary loopback DB URL; suite skipped cleanly. Root also checked fake remote URL. |
| `git diff --check` / scope / base | PASS | Reviewer-run; HEAD and origin/main both `ebfddac` before task commit. Root fetched/merged main, already up to date. |

Temporary local logs are diagnostic evidence, not repository artifacts.

## Findings and repairs

- Initial independent review found that an unconditional dedicated database-name
  assertion broke the default full integration command. Fixed: isolated Groq
  suite skips on other targets, and all mutating hooks live inside that suite.
  Full integration and ordinary-target skip regression both passed afterwards.
- Initial browser checks failed before application rendering because the first
  offline dependency install used system Node18 and omitted the matching native
  Tailwind asset. Root restored locked dependencies with Node22, cleared only
  this worktree's generated cache and reran successfully. No application/UI or
  lockfile workaround was added.

## Limitations and release boundary

Mocks establish protocol/policy behavior, not live model quality, Russian
teaching quality, actual account access or provider availability. Real Telegram
login was not tested; local authenticated test accounts are not proof of it.
Application request budgets do not replace Groq organization/token quotas or
enforce the account's billing plan. Fixed windows can admit requests around a
minute boundary; configured defaults remain intentionally conservative.

Production, Vercel settings/env, Neon production data, production migrations,
seeds and indexing were not touched. No live API requests were made. The new
migration must be separately reviewed/applied to the intended environment before
Groq is enabled there; a missing table fails closed. Human owns PR review/merge
and any later deployment/live smoke authorization.
