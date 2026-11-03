# Optional GroqCloud Free provider for Tutor V1

Status: DONE (PR open for human review)
Branch: dmitrij/feature/tutor-groq
Base: origin/main ebfddac
Date: 2026-11-03
Owner: root; exclusive schema/migration owner. Independent QA/review at final gates.

## Goal / acceptance
Add server-only optional Groq chat-completions adapter (default openai/gpt-oss-120b), strict existing guided/teaching schemas, lexical-only retrieval, no embedding service. Retain OpenAI/Yandex, existing Russian pedagogy, citation/answer/exam/auth/isolation boundaries and all deterministic learning logic. Add conservative configurable DB-backed provider-wide request budget across users/instances; no fallback or automatic retries. Missing credentials/invalid configuration fail closed.

## Scope / plan
Groq adapter and atomic quota reservation; additive TutorProviderUsage table without user FK or changes to existing tables. One provider row shared across all models/users/instances. Default1/minute50/UTCday, configured via GROQ_TUTOR_REQUESTS_PER_MINUTE / GROQ_TUTOR_REQUESTS_PER_DAY. Reserve only immediately before a generation request, retain failed attempts; fixed UTC windows, zero disables calls. Existing per-user admission/idempotency unchanged. Friendly quota message persisted through existing failed-turn UI. No new SDK, chatbot, vector store or runtime question generation.

## Tests / risks
Mock all HTTP. Test selection/defaults/missing keys, fixed endpoint/strict request, invalid/truncated/refused responses, timeout/429/error sanitization/bounds, citations/restricted actions, DB quota concurrency/rollover/failure, service idempotency/user isolation/protected exams, lexical-only retrieval/indexing and auth/origin regressions. Relevant integration against an isolated LOCAL test DB only; typecheck/lint/unit/build per QA. No production/Vercel/Neon writes/config, migrations/seeds/index, credentials or live API calls. Local additive migration requires independent safety review; migration stays unapplied in production.

## References
Groq official structured outputs: https://console.groq.com/docs/structured-outputs
Groq official API reference: https://console.groq.com/docs/api-reference
Groq official free quota/rate-limit docs: https://console.groq.com/docs/rate-limits
Provider free tier has independent request/token/org limits; application budget is not a billing guarantee. No provider auto-upgrade/fallback. Human must keep account on Free Plan and check console quotas; live model quality unverified.

## Implementation / verification
- Groq HTTP adapter reuses existing request bounds,25s timeout,2MB response limit, Russian policy, strict output schemas/Zod and server citation/coaching policy; no SDK/library/lockfile changes.
- Explicit lexical-only path skips cached vectors and embedding APIs. Existing text indexer remains usable without --embeddings.
- Global PostgreSQL reservation is a single atomic insert/upsert; one row spans users/models/server processes, retains failed requests and never rewinds newer UTC windows on stale timestamps/backward clock.8 new integration tests include real cross-process contention. Existing per-user quota, idempotency, ownership, leases and exam recheck retained. HTTP429 and exhausted local budget persist friendly failures through existing UI.
- Additive CREATE TABLE migration only; all six existing migrations unchanged. Exclusively tested on disposable local Docker PostgreSQL16 localhost55437/studyspace_groq_test; no existing local/production database accessed. Seven migrations + local seed applied; generate/validate/status/schema diff PASS. No production migrations/seeds/indexing/config/deployment or live AI requests.
- Initial isolated-suite guard broke default integration runner; independent review caught and fixed it: describe suite + hooks skip unless dedicated loopback DB matches. Independently verified fake ordinary DB URL gives SKIP/exit0 without DB work.
- Initial browser run9/9 failed on missing native Tailwind binding from install under system Node18. Reinstalled exact lockfile deps under Node22, generated Prisma and used fresh webpack dev cache; final browser9/9 PASS. No package/lock/source/UI change to fix environment.

## Final check matrix
| Check | Actual result |
| --- | --- |
| Mocked Groq/OpenAI/Yandex provider regressions | root pass; independent reviewer33/33 PASS |
| npm run typecheck | PASS, repeated after build-generated types |
| npm run lint | PASS |
| npm test |101/101 PASS |
| npm run test:integration (dedicated local DB) |56/56 PASS,48 existing +8 Groq |
| npm run test:e2e -- e2e/tutor.spec.ts |9/9 PASS, local Chrome; mocked UI AI / real auth-origin checks |
| npm run build | PASS, local production build |
| npm run db:generate / prisma validate | PASS |
| Local migration deploy/status/schema diff |7 applied, up to date, no difference |
| Ordinary database Groq suite guard | SKIP cleanly, no DB work |
| git diff --check / source scope | PASS; content/scoring/auth/UI/old providers unchanged except shared additive429 plumbing |

## QA / review / sync
Independent code review APPROVE after runner fix; final [QA](../qa/tutor-groq.md) and [review](../qa/tutor-groq-review.md) reports record evidence.
Final fetch + git merge origin/main: already up to date at ebfddac; no sync source changes.

## Limits / rollout / next step
Live quality/latency/model-account permissions are not verified; no Groq quota consumed. Keep account on Free Plan: application budget is request-based, not token/billing enforcement, and external usage or separate databases are outside its counter. No retry/fallback/auto-upgrade. Default1 per UTCminute and50 per UTCday configurable within0–30/0–1000; zero refuses requests.
Before any future enablement, human applies additive quota migration to intended environment and configures server-only key/provider; normal hosting default remains disabled. Do not automatically deploy/merge.
Implementation `dc21d67` pushed. PR: https://github.com/gulTrueKanekiSSS/vibe_code/pull/19 (open, not merged). Next: human review/merge; production and live enablement remain separate and unauthorized.

Local verification server and disposable PostgreSQL container stopped after checks.
