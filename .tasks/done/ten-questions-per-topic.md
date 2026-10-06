# Minimum ten practice questions in every existing topic

Status: COMPLETE — PR ready for human review, not merged
Branch: dmitrij/content/ten-questions-per-topic
Owner: dmitrij / TECH_LEAD

## Original Request

«сейчас на сайте есть различные темы, нужно минимум 10 заданий в каждой имеющейся теме в практике»

## Goal / User Story

As a learner I can select any existing topic and request ten distinct questions, rather than encounter a nearly empty question bank.

## Current Problem / Repository Findings

Baseline: 64 topics, 352 questions; 47 topics below ten, total shortfall 390. Target minimum: 742 questions. Base origin/main 6a92406. Only unrelated untracked .idea/ exists; preserve it. All existing topics can be selected explicitly; supplementary/future labels and automatic-course filtering must remain unchanged.

## Expected Behavior / Scope

- At least ten distinct, varied questions in every existing topic, including existing supplementary/future topics without reclassifying them as confirmed curriculum.
- Preserve all existing question objects/IDs; append original questions with answers, full reasoning and three progressive hints.
- Add coverage and answer-validation regressions; verify ten-question custom sessions using existing service and DB.
- Update content progress and project recap. Use existing upsert seed locally; do not reset data.

## Out of Scope

New topics, UI redesign, authentication, practice architecture/scoring, AI, schema/migrations, deployment, automatic merge.

## Acceptance Criteria

- [x] All 64 source topics have >=10 questions; existing 352 questions unchanged.
- [x] Added answers reviewed/recomputed; no numeric-only filler, duplicate IDs/prompts, malformed math/code.
- [x] New records loaded via seed and selectable in ten-question sessions for every topic without duplicates; order persists on reload/retry.
- [x] Content/unit/integration checks, typecheck, lint, build and relevant browser check pass.
- [x] Independent QA/review completed; progress and recap updated; main synchronized.
- [x] Commit/push and PR ready; no merge.

## Technical Plan / Ownership

- Frontend: none; preserve components.
- Backend: none; root owns integration tests and adjustment of obsolete test assumptions only.
- Database: no schema ownership needed; root alone runs seed and DB checks.
- CONTENT-programming: content/questions/programming below ten; own tests/minimum-programming.test.ts and reviewed C fixture.
- CONTENT-analysis: content/questions/analysis below ten; own tests/minimum-analysis.test.ts.
- CONTENT-discrete: content/questions/discrete below ten; own tests/minimum-discrete.test.ts.
- Root CONTENT: architecture and geometry below ten; own tests/minimum-architecture-geometry.test.ts.
- Root alone edits shared reports, general coverage tests and task file. No concurrent edits to shared core files. Agents do not change Git branches or commit independently.
- After implementation, independent reviewer/QA inspects diff and acceptance criteria; fixes return to owning workstream.

## Risks

Wrong/ambiguous answers; near-duplicate filler; C undefined behavior; future-topic scope confusion; stale DB; hardcoded tests expecting one question; concurrent development. Controls: explicit all-existing-topic scope, immutable baseline comparison, independent calculations/Boolean enumeration/C11 fixtures, isolated test users, no core changes.

## Test Plan

- Unit: content schemas, >=10 per topic, duplicate screening, answer calculations/proof witnesses and compiled defined C traces; never execute UB as oracle.
- Integration: seeded content matches source; ten distinct questions per topic via existing custom practice, persistence and idempotency; protect XP/privacy/automatic curriculum filtering.
- Manual/E2E: representative custom ten-question session and refresh if local runtime available. No real Telegram claims.
- typecheck, lint, production build; Prisma validate/status read-only. Review diff and git diff --check before commit.

## Implementation Log

- 2026-10-05: PM normalization and Tech Lead inspection complete; base synced; content workstreams assigned by subject.
- 2026-10-06: Recovered saved batches after interrupted agent turns. Added 390 questions in 47 existing topic files; 742 total. Architecture +66, geometry +53, analysis +83, programming +95, discrete +93.
- All old question objects preserved, full solutions and three progressive hints. Separate computation/Boolean/C11/witness suites plus canonical old-object hash regression.
- Independent review fixed XOR total-bit wording, integer/domain hypotheses and 42 inflated new difficulty labels. No core app/auth/schema changes.
- Updated stale practice integration/browser counts, absent-difficulty EASY-only isolated fixture and unseen-question repeat expectations. QA caught nullable Prisma JSON fixture typing; fixed with validated source content without casts.
- Existing safe upsert seed loaded 742 into local DB. No user data reset. Generated next-env build imports restored to verified initial state; unrelated .idea/ untouched.

## QA Result

Status: PASS — independent QA agent review_final_programming

Acceptance mapping:
- Source floor and old-ID/content integrity: minimum-topic-coverage tests, canonical 352-object digest and independent read-only baseline audit.
- Answer correctness: all 390 reviewed independently by three subject reviewers; 51 defined C11 traces +44 programming conceptual oracles, mathematical calculations and proof/counterexample witnesses.
- Runtime selection: all 64 topics tested through ten-question topic and custom sessions; ten unique questions, first-answer grading, persisted order/state and retry idempotency.
- Browser: five expanded subjects with ten-question refresh scenarios; existing start/weak/daily/by-topic/auth/origin regressions.

Commands completed successfully:
- npm test: 48/48.
- npm run test:integration: 26/26 after final fixture fixes.
- npm run test:e2e -- e2e/practice-start.spec.ts: 19/19 after content fixes.
- npm run typecheck; npm run lint (zero warnings); npm run build.
- npm run content:check: 742, all64 >=10, duplicate-template candidates0.
- npm run db:seed: 742; prisma validate; prisma migrate status: valid/up to date, five existing migrations.
- git diff --check; latest main fetch/merge.

No real Telegram authentication or deployed-environment verification claimed. Full unrelated browser suite not rerun.

## Review Result

Status: APPROVE

- review_final_content: reviewed all119 architecture/geometry additions; XOR/calibration findings fixed; repeated subject/global tests5/5; no outstanding blocking findings.
- review_final_math: reviewed all176 analysis/discrete additions; explicit hypotheses and35 difficulty corrections verified; subject suites10/10 after fixes.
- review_final_programming: all95 programming additions correct, compiled/reviewed coverage complete; tests9/9. Independent final QA PASS after TS fixture correction.
- Scope audit: only content, tests and reports; no app/auth/curriculum/lessons/Prisma changes. All352 original objects unchanged.
- NOTE: some architecture/geometry conceptual witness tests do not bind to the MC answer key; current keys manually reviewed. Further oracle strengthening optional, not a merge blocker.

## Sync With Main

Latest origin/main fetched: 2026-10-06, 6a92406
Merged into task branch: final git merge origin/main — Already up to date
Conflicts: none
Checks rerun after final sync: all final checks above; final formatting repeated unit/typecheck

## Result

Commits: 2e21172 (content), 4189218 (tests), 8c2e49f (QA/review reports); closure commit in branch history
Pushed branch: origin/dmitrij/content/ten-questions-per-topic
PR: https://github.com/gulTrueKanekiSSS/vibe_code/pull/4 — open into main, not merged
Publication: existing GitHub authentication used via API without credential output; no new auth tooling/settings installed
Known limitations: no deployment authorized; seed applies to local configured DB only
Follow-up: human PR review/merge, then existing deployment seed workflow if needed; no further content expansion within this task
