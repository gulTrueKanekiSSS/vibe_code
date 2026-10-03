# Replace the practice builder

Status: BLOCKED (implementation complete; database-dependent QA pending)
Branch: lvenokkkk/feature/practice-builder-redesign
Owner: lvenokkkk
Base: origin/main at 449873f

## Original Request
Execute `promt for new construct practise.md`: replace the existing builder with the described responsive interface and verify setup, start, completion and resume.

## Goal / User Story
As a learner, configure practice in a compact grouped interface, see an accurate summary, and resume the resulting saved session.

## Current Problem
The existing builder is a long flat form without topic search, module navigation, summary or automatic topic selection.

## Expected Behavior
One builder on both existing routes; presets, goals, 1–20 slider, module/search scoped tri-state selection, removable tags, automatic topics, live summary and collapsed advanced options. Preserve existing sessions and every question type/category.

## Scope
- Frontend builder and safe module metadata from PracticeSetup.
- Pure configuration/selection helpers; unit and browser regression tests.
- Documentation and independent QA/review.

## Out of Scope
- Content expansion, auth, scoring, schema/migrations, deployment.

## Acceptance Criteria
- [ ] Existing links and saved-config editing render the new single builder.
- [x] Presets/goals affect actual options; manual changes persist until explicit preset/goal action.
- [x] Search and bulk selection affect only available topics in the active module; tags and counters stay consistent.
- [x] Subject changes remove incompatible selections and preserve compatible filters.
- [x] Availability matches server filtering; insufficient/empty/error/busy states are actionable.
- [x] Automatic selection uses eligible curriculum topics and active filters, replaces selection, respects limits and is deterministic.
- [ ] Existing API creates one saved session, resumes after refresh, honors hints/feedback and preserves old configs.
- [x] Desktop/mobile, light/dark, keyboard and required checks verified or exact blockers documented.

## Repository Findings
- PracticeSetup supplies safe question metadata; add module ID/title (no answers).
- PracticeBuilder is shared by /practice and /practice/custom; POST /api/practice and practice-service already support persistence/idempotency.
- Empty topic list means all topics under existing project rules; retain with explicit copy.
- Existing presets: EASY/5; EASY+MEDIUM/10; MEDIUM+HARD/10; HARD+CHALLENGE/15. Last disables hints and delays feedback.
- Root worktree has unrelated unfinished content changes; isolated worktree preserves them.
- Reference image absent: use prompt's textual specification.

## Technical Plan
### Frontend
Owner: primary FRONTEND. Files: builder, practice-setup, globals.css, pure builder helper. Implement layout and scoped state.
### Backend
Owner: primary; inspection only unless parity bug requires change. Keep existing API contracts.
### Database
Owner: none. No changes/migrations.
### Content
Owner: none. No changes.

## Risks
- Empty selection semantics, hidden stale category filters, duplicate POST retries, old saved configurations, mobile overflow.

## Test Plan
### Unit
Selection scopes, availability parity, auto topics/limits, preset/goal settings, compatibility cleanup.
### Integration
Existing PostgreSQL suite: session persistence, repeat, access, hints/feedback, idempotency.
### E2E / Manual
Both entry routes; presets, search/bulk/tags/clear/auto; subject changes; empty/insufficient; retry/duplicate; refresh and saved config; screenshots on desktop/mobile and themes.
Commands: typecheck, lint, npm test, test:integration, build, test:e2e.

## Implementation Log
- Inspected routes, safe metadata, API/service, existing tests, styles, curriculum and local Next.js use-client guide.
- Resumed existing worktree on 2026-10-03; root worktree's content expansion and staged prompt were left untouched.
- Replaced the shared builder with presets, goals, grouped searchable topics, scoped selection, removable tags, live summary and collapsed advanced settings. Kept all nine question types, content categories, 1–20 count, and existing empty-selection semantics.
- Added pure filtering/subject cleanup/automatic-selection helpers and six unit tests, plus five browser regression tests. Updated existing practice browser selectors for the new layout.
- Added deterministic subject/module/topic ordering and proper heading levels for standalone versus embedded usage. Removed obsolete builder-only styles.
- Documented preset, goal and automatic-selection semantics in README. No schema, migrations, question content, authentication or scoring changes.

## QA Result
Status: BLOCKED for full application flow; component/unit/build checks PASS.

Commands (2026-10-03, after main sync and review fixes):
- `npm test`: PASS, 38 tests (including six builder tests). Windows sandbox prevented tsx from reading the user profile; rerun outside sandbox succeeded.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS, including standalone final rerun after review.
- `npm run build`: PASS, all routes compiled using local Next.js 16.3.6.
- `npx prisma validate`: PASS; no schema changes.
- `npm run test:integration`: BLOCKED, 1 passed / 25 failed because PostgreSQL at localhost:5433 cannot be reached. No reset or migration was attempted.
- `npm run test:e2e -- --max-failures=1`: BLOCKED in authenticated fixture creation by the same database outage; 1 failed, 20 not run.
- `npx prisma migrate status`: BLOCKED, P1001 at localhost:5433.
- `node .local/verify-practice-builder.cjs`: PASS twice, including after final code fixes. This local browser harness bundles the actual component with safe source-derived metadata; API/navigation are mocked. It verifies scoped search/tri-state/tags, keyboard count, goals/presets/manual changes, deterministic auto selection, subject cleanup, payload, busy duplicate protection, error/retry key, config rehydration, empty state and 390px mobile overflow. It does NOT verify database persistence.
- `git diff --check`: PASS.

Visual inspection: actual-component desktop dark and mobile expanded light screenshots inspected; no overflow or overlapping content observed. Light/dark desktop/mobile screenshots are local artifacts under `.local/builder-*.png`, excluded from Git. Reference PNG not supplied, so pixel comparison is unavailable.

Manual application verification still required once PostgreSQL is running:
1. Start this worktree with `npm run dev`; open `/practice` and `/practice/custom` using an authenticated learner.
2. Select a subject, switch modules, search, select-all, remove tags and clear. Confirm summary and availability.
3. Choose a preset, edit levels/types/categories/count, then start. Confirm questions match settings and double clicks create one session.
4. Answer a question, reload its session URL, and confirm saved answer/progress/order. Complete, inspect results, repeat and edit saved settings.
5. Repeat with hints disabled/end feedback and an older saved configuration; run integration and full E2E suites.

Environment: Docker and PostgreSQL executables/services were not found in standard locations/PATH. Asked the user asynchronously to start the existing database or identify its launcher; no response yet. Do not mark the task DONE until application verification is completed.
## Review Result
Status: APPROVE for source changes, database QA blocker retained.
Independent reviewer `/root/review_practice_builder` followed agents/REVIEWER.md. Found and fixed an E2E assertion reading a category checkbox after advanced settings remounted collapsed. Fixed the minor standalone summary heading hierarchy finding. Confirmed filtering parity, scoped selection, compatibility defaults, API contract preservation and idempotency guard. Build-generated next-env.d.ts changes excluded.
## Sync With Main
Latest origin/main fetched: 2026-10-03; still 449873f.
Merged into task branch: `git merge origin/main` reported already up to date.
Conflicts: none
Checks rerun after sync: unit tests, lint, build and actual-component browser harness passed.
## Result
Commits: feature commit prepared after QA/review; see branch history.
PR: draft PR into main; link recorded after creation.
Known limitations: reference PNG unavailable; real database/API/session completion/resume verification blocked by unavailable PostgreSQL.
Follow-up: start existing local DB, rerun integration/E2E/application verification, then move task to .tasks/done and mark PR ready. Human owns merge.
