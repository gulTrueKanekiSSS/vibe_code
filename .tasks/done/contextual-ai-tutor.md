# Contextual AI Tutor V1

Status: DONE — PR ready for human review; live provider rollout not certified
Branch: dmitrij/feature/contextual-ai-tutor
Owner: dmitrij / Codex; base origin/main 03790cf (human merged PR #6).

## PM — normalized request

Goal: a Russian-speaking contextual personal tutor that advances understanding one small diagnostic step at a time, preserving English academic terminology.
Problem: topic pages have a disabled Tutor card; students cannot discuss the exact confusing lesson section or exercise.
Expected behavior: contextual drawer, persistent owned conversation, Explain/Simpler/Hint/Why/Check actions, short explanations and one diagnostic question, course references, safe exercise context and graceful unavailable/error states.
User's explicit new feature request supersedes former Coming soon/no-AI constraints for this task.

## Scope / non-goals

V1: provider boundary, course-grounded retrieval over existing published MDX/Topic content, persisted history with bounded context, contextual lesson/practice UI, server auth/origin/validation/rate limits, sources and security tests.
No autonomous teacher, generated scored questions, code execution, PDF upload/parser UI, changes to Telegram auth or deterministic practice/mastery/GPA, separate vector service or StudentConceptState.

## Acceptance criteria

- [x] Contextual lesson and exercise entry points; visible context, mobile/keyboard support and refresh history.
- [x] Short Russian/one-diagnostic-question instructions and safe quick actions implemented. Live progressive teaching quality remains unverified; unresolved exercises use constrained coaching templates.
- [x] Owned conversations/messages; bounded provider history and request size; idempotent persisted turns, errors/timeouts and rate limits.
- [x] Source chunks and embeddings in PostgreSQL; subject-scoped retrieval with topic priority; source IDs/metadata validated. Factual grounding of live prose still requires evaluation.
- [x] Missing configuration is a useful unavailable state, not a crash; server provider markers absent from client build.
- [x] Exam/delayed-feedback/no-hints protection enforced server-side, including access through other contexts; no protected answer/solution/grading exposure.
- [x] AI cannot modify existing scored practice/progress; only safe user learning context leaves the server.
- [x] Unit/integration, typecheck, lint, build, Prisma validation/generation/migration checks and relevant E2E; independent QA/review.
- [x] Latest main integrated, committed, pushed, [PR #7](https://github.com/gulTrueKanekiSSS/vibe_code/pull/7) prepared; human merge only.

## Repository findings

Subject -> Module -> Topic; each Topic.content contains lesson sections + a self-check answer. Question/PracticeItem/PracticeAttempt hold separate protected grading data. Existing routes validate auth/origin/Zod and lock user rows for practice mutations. No Tutor DB models/provider exists.
Current local PostgreSQL has no available/installed pgvector extension. Tracked deployment is postgres:16-alpine Docker Compose + generic production README; production extension support cannot be inferred. No OPENAI_API_KEY/TUTOR_MODEL configured (presence only checked; no secrets printed).
Existing instructions/README/schema/placeholder/topic and practice pages/auth/content loader/service/practice visibility rules inspected. Relevant master sections: progressive hints, feedback, Exam Mode, content storage/future PDFs. Local Next route docs and official OpenAI structured-output/embedding docs inspected.

## Tech Lead plan / ownership

- DATABASE exclusively owns schema/migration: TutorConversation, TutorMessage, TutorUsage, LectureChunk; additive relations only. Preserve existing migration history and user data.
- BACKEND owns tutor context/service/routes and service integration tests. Reuse session guards, keep permissions checked per request and per conversation. Persist a leased pending turn before external work; bounded quotas count failures too. Never hold a DB transaction during provider calls.
- FRONTEND owns TutorPanel, contextual mounts in topic/practice UI, scoped CSS and Tutor E2E. Preserve practice start/submit/hint logic.
- ROOT owns shared tutor types, provider, retrieval/indexing, prompt/response policy helpers, unit tests, configuration/docs, overall integration. Shared contracts agreed before parallel edits.
- QA/Reviewer separately verify final behavior/diff after implementation.

### RAG / provider

Use existing curated Topic sections as canonical lecture documents; chunks keep subject/module/topic/lesson/title/section/page metadata. Index command supports deterministic chunk hashes and embedding refresh. PostgreSQL float arrays plus bounded subject candidates and cosine ranking are sufficient for this corpus; no unsupported extension migration. Embedding model identity prevents mixing vectors. Source links built from validated retrieved IDs, never model-generated URLs. No match produces explicit insufficient-materials behavior; general knowledge must be labeled.
Provider interface separates generation and embedText from services. First REST OpenAI adapter, server env only, bounded responses, timeouts and sanitized errors; no live paid calls without configuration. Raw output is validated before display; streaming deferred for safety.

### Practice safety

Do not send question answer, hidden hints, solution or feedback maps before existing rules permit disclosure. For unresolved exercises use constrained coaching actions rendered by the server, rather than unrestricted model prose; after permitted disclosure, grounded free explanation is available. Active Exam Mode blocks Tutor across lesson/history routes; delayed feedback and disabled hints are protected too. No AI mutation of practice score/state. Conversation context is immutable and server-resolved.

### History / privacy

Keep owned persisted turns; send only a bounded recent window and bounded learning checkpoint if needed. Exclude profile/Telegram/session identifiers and unrelated learning history from provider input. Validate body/IDs/message lengths, cap conversations/turns, serialize admission using existing PostgreSQL, and handle retries without duplicate turns or unbounded cost.

## Risks / required verification

Highest: protected-data leakage, alternate-route exam bypass, cross-user access, concurrent/replayed paid requests, stale embeddings/citations and context overflow. Tests use deterministic injected provider doubles, not dev-auth as proof of real Telegram or mocks as proof of real LLM quality.
Run required repo checks; apply additive migration only to authorized local DB. Deployment/real provider smoke and teaching-quality evaluation may require owner credentials; report honestly.

## QA / Review / Sync / Result

Implementation preserved across interruptions: additive models/migration, safe owned API/service, contextual responsive drawer, provider abstraction, course index/retrieval, persistence and quotas. Root completed missing RAG/index/provider tests/config/docs rather than restarting existing work.

Verification: full typecheck/lint PASS; unit 62/62 and integration 40/40 PASS after review fixes; final Tutor E2E 9/9 plus earlier 3 practice regressions PASS; production build PASS. Prisma generate/validate/migrate status and schema drift check PASS, only local database changed. Text index created for 64 topics / 505 chunks; 0 paid embeddings. [QA](../qa/contextual-ai-tutor.md), [independent APPROVE](../qa/contextual-ai-tutor-review.md).

Fixed findings: keyboard focus escape, test fixture lint name, expired pending error text, safe options/type context, removal of private exercise IDs from provider payload, external-image Markdown egress and editor lock after definitive rejected requests. No auth/scoring/content-bank changes. Unrelated `.idea/` preserved.

Main fetched and merged: already up to date at `03790cf`. Implementation commit `720445153a7bf48d793994a2434d28180d8cd825` pushed successfully to existing task branch. [PR #7](https://github.com/gulTrueKanekiSSS/vibe_code/pull/7) is open into main, not merged. No force operations, reset or automatic merge. Exact next step: human PR review; configure server AI credentials/models and perform the documented live teaching/embedding smoke before production rollout.

Release limitations: no credentials/live provider or real Telegram test; no paid semantic index built locally; no raw streaming or automatic history summary. Free model explanations are limited to lessons and legitimately unlocked exercises; unsolved exercises use safe server coaching actions. Owner must configure models/key, run index with `--embeddings`, and validate teaching quality before production rollout.
