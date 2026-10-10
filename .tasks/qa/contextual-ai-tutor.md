# Contextual AI Tutor V1 — independent QA

Date: 2026-10-09. Branch: `dmitrij/feature/contextual-ai-tutor`; base `03790cf`.
Scope: independent acceptance/test inspection and execution on the current Tutor worktree, not live provider or production certification.

## Execution

Commands use repository Node 22: `PATH="$PWD/node_modules/.bin:$PATH"`.

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0; rerun after review fixes |
| `npm run lint` | PASS after owner renamed fixture `module` to `courseModule`; initial Next `no-assign-module-variable` failure resolved; final post-review-fix full rerun exited 0 |
| `npm test` | Final PASS: 62 tests, 0 failed/skipped, including 9 Tutor policy/provider/retrieval unit tests and 2 safe-renderer tests; initial pre-review pass was 60/60 |
| `npm run test:integration` | Final PASS: 40 tests, 0 failed/skipped, including 11 Tutor service and 3 retrieval/index tests against local PostgreSQL; rerun after review fixes |
| `git diff --check` | PASS |
| Production build | PASS, root `npm run build` exit 0, Next 16.3.6 webpack; `/api/tutor` dynamic route generated. Build's generated next-env path-only changes restored to tracked dev paths; no application edits |
| Browser E2E | UI-owner final `npm run test:e2e -- e2e/tutor.spec.ts`: PASS 9/9 after review fixes. Earlier combined run also passed 3 existing practice regressions (topic rapid clicks/first question, quick start, delayed feedback). Not rerun by this QA agent |
| Prisma generate/validate/migration/drift | PASS reported by Database owner/root: client generated, schema valid, migration deployed to loopback only, status current, live-schema diff empty; original table counts preserved. Not rerun by this QA agent |
| `npm run tutor:index` | PASS reported by root: 64 topics, 505 chunks, 0 embeddings created; no paid calls |
| Main synchronization | Root reports fetch + merge `origin/main` already up to date at `03790cf`, before final QA reruns |

Final engineering QA verdict: **PASS**, including reruns after independent-review fixes. Root aggregated build/browser evidence on 2026-10-10; independent reviewer **APPROVE** in [review report](contextual-ai-tutor-review.md). Live provider/teaching-quality evaluation remains explicitly unverified, as described below; this is not production certification.

Root additionally checked generated `.next/static` for server-only `OPENAI_API_KEY`, `TUTOR_EMBEDDING_MODEL` and provider endpoint markers: no matches. No secret values printed. Publication status is recorded in the task/recap, not inferred from this QA result.

## Findings resolved

- QA lint finding: reserved `module` fixture variable renamed; full lint passed twice afterward.
- Independent reviewer identified model Markdown image/link egress and composer retry lock after authoritative 4xx rejection. Owner added a Tutor-only renderer that disables images, links and trusted math commands, plus retry recovery while retaining idempotent network retry. QA independently inspected renderer/test assertions; full unit/type/lint/integration suites pass after the changes. Browser regression execution remains attributed to the UI owner.
- Root removed private practice item identifiers from outbound provider context; updated provider unit assertions pass in the final full suite.

## Acceptance evidence

| Area | Verified evidence |
| --- | --- |
| Contextual lesson/section/exercise UI | Targeted inspection of `TutorPanel`, topic/practice mounts and E2E assertions: visible server context, quick actions, responsive dialog, keyboard focus trap/return, retry identity and refresh history. Browser execution evidence belongs to the UI/root check. |
| Conversation ownership/persistence | Service integration verifies stored turns/citations, fresh snapshot equivalence, separate user has no history, foreign practice item denied, mismatched topic denied, replay does not generate twice. |
| Safe exercise context | Integration asserts no answer/correctness/hidden solution, only unlocked hints, permitted solution after practice completion. Restricted generation receives no retrieved sources; arbitrary teaching text/extra answer fields are rejected by strict guided-output unit tests. |
| Protected modes | Integration checks user-wide exam, delayed-feedback and no-hints blocks, including old lesson history. Starting an exam during generation suppresses the response before storage/exposure. E2E code covers disabled practice entries and alternate lesson access. |
| Deterministic learning remains authoritative | Integration compares practice item and TopicProgress before/after Tutor coaching. Existing practice/XP/mastery/GPA/privacy regression tests passed in full suites. |
| Bounded persistence/provider work | Tests cover recent history count/UTF-8 limits, conversation cap, persistent hourly/daily limits, charge-on-failure, reset retaining quotas, duplicate/concurrent admission and stale lease recovery. |
| Input/auth/origin boundaries | Service rejects invalid IDs/context/section/message; E2E code exercises anonymous GET, foreign-origin GET/POST, duplicate query parameters, overlong message/body, zero conversations created on rejected requests. No new authentication flow. |
| Course retrieval | Real DB tests verify persisted embeddings using a fake embedding provider, repeated indexing without duplicate/recomputed records, subject isolation, topic priority, server source URL, hidden quiz-answer exclusion, stale-content rejection, lexical fallback on outage/model mismatch and stale-vector invalidation. Unit tests cover section priority, bounded sources and Unicode chunking. |
| Provider failure/configuration | Injected-fetch unit tests cover missing/unsupported configuration, strict structured output, `store:false`, invalid output, failures, timeout, embedding dimension/index validation and restricted payload. Missing provider creates no conversation or paid call. |
| Sources/grounding | Unit tests require known retrieved IDs for course replies; unknown IDs/missing course citations become insufficient-material response. Sources and destinations are server-owned. General-model knowledge is labeled. These tests validate provenance mechanics, not factual entailment of live prose. |
| Pedagogical behavior | Short Russian, one diagnostic question, progression and minimal prerequisite repetition are encoded in instructions/quick actions. Restricted unsolved practice intentionally uses fixed server coaching templates. Real teaching quality is NOT VERIFIED by mocks. |

## Limitations / release follow-up

- No real OpenAI request, paid embedding run or production deployment was performed. Credentials are absent; model compatibility, model quality, latency and paid usage require a configured owner smoke test.
- Browser mock conversation tests prove UI behavior only. Development-auth fixtures do not prove real Telegram login.
- No unrestricted model-written tutoring before a practice solution is legitimately visible: this is an intentional capability boundary, not a fully adaptive free-form exercise tutor.
- Responses are validated before display, not streamed. History uses a bounded recent window; no semantic long-term summary is generated.
- PostgreSQL float arrays with bounded same-subject candidates are V1 retrieval, not a pgvector scalability/performance evaluation. PDFs are externally transformed material; no PDF parser or page-number inference was tested.
- Grounding metadata is verified; semantic accuracy and instruction-following of a live model still require evaluation. The UI warns users that responses can be wrong.
- No unrelated application/auth/content changes were made by QA. Only this report is QA-owned; the root owns recap, final evidence aggregation and publication.
