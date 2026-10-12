# feat(tutor): support Yandex AI Studio for Russian users

## Goal / implementation

- Add native Yandex AI Studio provider selected by server `TUTOR_PROVIDER=yandex`.
- No OpenAI key/dependency required in Yandex mode; fixed HTTPS endpoints,
  server-only credentials, disabled request logging, sanitized bounded responses.
- Reuse strict Tutor teaching/coaching policy; preserve exam/answer protection,
  owned conversations, source validation and deterministic practice/mastery/GPA.
- Correct doc/query embeddings; provider/pair/algorithm cache identity; full-text
  Unicode splitting and weighted pooling for native input limits, bounded query time.
- Update `.env.example`, README and recap. No schema/migration/UI/auth/content changes.

## Verification

- Unit76/76 (14 new Yandex tests), integration48/48 PASS.
- TypeScript, lint and production build PASS.
- Post-sync typecheck + provider23/23 PASS.
- QA and independent review reports under `.tasks/qa/tutor-yandex*.md`.
- Latest origin/main c538d03 integrated; no conflicts.
- No UI changes, so browser E2E not rerun. No Prisma changes, so migrations skipped.

## Deployment / limitations

Set server TUTOR_PROVIDER=yandex, YANDEX_API_KEY and YANDEX_FOLDER_ID privately;
enable billing and run `npm run tutor:index -- --embeddings` (paid API use).
Restart app. Local secrets are untouched and not committed. No live Yandex calls
were made: account permissions, billing, teaching/retrieval quality and deployment
remain unverified. Long-text vector pooling is approximate; request pacing is local
to one adapter, not a distributed limiter. OpenAI remains an explicit alternative
for supported scenarios; there is no automatic cross-provider fallback.

Human review/merge only. Do not auto-merge.

Published: https://github.com/gulTrueKanekiSSS/vibe_code/pull/9 (OPEN, not merged).
Resume 2026-10-12: provider23/23 PASS; 20-case live pilot prepared at
`.tasks/qa/tutor-yandex-live-pilot.md` (NOT RUN, credentials missing).
