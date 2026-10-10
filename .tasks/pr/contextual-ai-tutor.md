## Goal

Implement the first contextual StudySpace AI Tutor without changing authentication, scored practice or deterministic mastery/GPA.

## Changes

- Lesson/section/exercise drawer, quick actions, owned history, responsive keyboard-safe UI and source navigation.
- Server-only provider abstraction, first OpenAI Responses/embeddings adapter, bounded context/timeouts and graceful missing-key/error states.
- Existing course sections → stable chunks → cached PostgreSQL float-array embeddings → bounded subject/topic-prioritized retrieval. Explicit lexical fallback; stale material invalidated. No pgvector infrastructure required.
- Additive TutorConversation/TutorMessage/TutorUsage/LectureChunk migration, idempotent requests, per-user quotas and fenced leases.
- User-wide exam/delayed/no-hints protection, constrained unresolved-exercise coaching, safe Markdown without external image/link egress. No AI writes to practice/progress.
- Setup/index/privacy documentation and durable task/recap.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run build`: PASS.
- `npm test`: 62/62; `npm run test:integration`: 40/40.
- Final Tutor E2E: 9/9; existing selected practice regressions: 3/3.
- Prisma generate/validate/migrate status/schema-drift checks PASS; migration applied only to local loopback DB, existing learning data preserved.
- Text indexing: 64 topics / 505 chunks / 0 paid embeddings.
- Independent review APPROVE after fixing untrusted Markdown image egress and rejected-request recovery. Detailed evidence: `.tasks/qa/contextual-ai-tutor.md` and `contextual-ai-tutor-review.md`.
- Latest `origin/main` integrated at `03790cf`; no unrelated `.idea/`, credentials or generated build files staged.

## Deployment / limitations

Apply migration and generate Prisma client before running new code. Set server-only `OPENAI_API_KEY`, `TUTOR_MODEL`, `TUTOR_EMBEDDING_MODEL` (optional `TUTOR_PROVIDER=openai`), publish course content and run `npm run tutor:index -- --embeddings`. This command can incur provider charges.

No live AI credentials, paid embedding run, real Telegram smoke test or production deployment was available/performed. Tests use deterministic provider doubles. Owner must validate model compatibility and teaching quality. Before solution disclosure, exercise assistance is limited to server coaching templates, not unrestricted adaptive prose. Streaming and automatic conversation summaries are deferred; bounded recent history is implemented. Bounded float-array retrieval is for the current small corpus.

Human review and final merge only. Do not auto-merge.
