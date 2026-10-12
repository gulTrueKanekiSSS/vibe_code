# Tutor for Russia: Yandex AI Studio

Status: DONE (implementation and PR handoff; live activation pending credentials)
Branch: `dmitrij/feature/tutor-yandex`
Owner: root (Backend); separate QA/review agents
Base: `origin/main c538d03`, including human-merged PR #8.

## Request / goal

«Адаптируй на Россию»: support Yandex AI Studio without OpenAI credentials or
bypassing regional restrictions. Preserve UI, owned history, course grounding
and deterministic exam/answer boundaries.

## Scope / acceptance

- Explicit `TUTOR_PROVIDER=yandex`, server-only key/folder/model settings.
- Native completion with JSON schema; local validation of all model output.
- Distinct document/query embedding models and provider/model-pair cache identity.
- Fixed HTTPS endpoints, disabled data logging, bounded reads/timeouts,
  sanitized errors; no automatic cross-provider fallback.
- Existing OpenAI config compatible; missing settings fail gracefully.
- Setup/indexing instructions and honest live verification limitations.
- No UI/auth/practice/scoring/schema/content changes, credentials or paid live calls.

## Plan / ownership

Root: shared provider safety/payload helpers, Yandex adapter/factory, embedding
purpose at two call sites, tests/docs. QA agent: independent evidence. Reviewer:
final diff. No database workstream or migration needed.

## Risks / verification

Native status/schema/auth differ from OpenAI; use official docs. Do not mix vector
spaces. Real permissions, billing and teaching quality require a credentialed smoke.
Run provider unit tests, Tutor integration including purpose routing, full unit,
typecheck/lint/build. No UI changes; browser tests optional regression.

## Sources (inspected 2026-10-10)

- https://aistudio.yandex.ru/ru/docs/ai-studio/text-generation/api-ref/TextGeneration/completion
- https://aistudio.yandex.ru/ru/docs/ai-studio/embeddings/api-ref/Embeddings/textEmbedding
- https://aistudio.yandex.ru/ru/docs/ai-studio/concepts/embeddings
- https://aistudio.yandex.ru/ru/docs/ai-studio/operations/get-api-key
- https://aistudio.yandex.ru/ru/docs/ai-studio/operations/disable-logging

## QA / review / publication

Implementation complete. Shared payload/schema and bounded HTTP helpers extracted;
Yandex native completion and document/query embeddings added. Long text uses
1800-byte Unicode-safe pieces and byte-weighted mean (algorithm-tagged identity),
110ms per-instance request pacing, overall query budget25s. No real env changes.

Root checks PASS: typecheck, lint, npm test76/76, integration48/48, production build.
QA independently added/ran14 Yandex tests and targeted lint, PASS. After final fetch
and merge origin/main c538d03 (already up to date), typecheck/provider23 tests PASS.
Build-only next-env generated diff removed, unrelated .idea preserved.
No Prisma changes: no migrations/validation needed. No UI changes: E2E omitted.
Live provider/account/model access and retrieval/teaching quality not tested.

Independent review APPROVE: `.tasks/qa/tutor-yandex-review.md`, no unresolved blockers.
QA report: `.tasks/qa/tutor-yandex.md`.

## Handoff 2026-10-12

Interrupted push completed: local/remote implementation SHA
`dcaed237b0942476b4974d8aeab21a349a110843`. No stale git/node process found.
Fetch/merge origin/main remains c538d03, already up to date; provider23/23 rerun PASS.
Created [PR #9](https://github.com/gulTrueKanekiSSS/vibe_code/pull/9), OPEN, not merged.
Added `.tasks/qa/tutor-yandex-live-pilot.md`: 20 NOT RUN checks over two existing
lessons and security/history. No application changes on resume.

Exact next step: human PR review/merge and private Yandex key/folder setup with
`TUTOR_PROVIDER=yandex`, then explicitly authorized small-topic embeddings and live
pilot. Presence-only env check: key/folder missing, Yandex not selected; no secret
values printed. Real account/teaching quality and production deployment not verified.
