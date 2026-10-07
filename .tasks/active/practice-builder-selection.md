# Easier, more pleasant practice selection

Status: READY_FOR_PR
Branch: dmitrij/feature/practice-builder-selection
Owner: dmitrij / PM + TECH_LEAD

## Original Request

«Я бы хотел чтобы составление заданий было более приятным в плане выбора чтоли, чтобы проще было выбирать. Изучи лучшие практике с подобными практиками на различных сайтах. Проанализируй и реализуй лучший вариант или оставь старый если он лучший»

## Goal

Reduce the effort and visual overload of choosing a custom practice session, based on an evidence-backed comparison with learning platforms.

## User Story

As a learner I can quickly find topics and understand my chosen practice before starting, without losing advanced manual controls.

## Current Problem

Builder presents presets, subject, count, four difficulties, up to64 mixed topic chips, patterns, answer types, hints and feedback simultaneously. Topics are a220px ungrouped scrolling area; no topic search or selected-topic overview. Zero explicit topics means all, but ordinary unchecked boxes can appear to mean none. Start/availability are at the bottom.

## Expected Behavior

A short single-page setup (not a multi-step wizard), clear topic scope and searchable selection, editable existing presets, visible session summary/start, advanced controls still reachable and accurately reflected when active.

## Scope

- Audit current builder visually and structurally.
- Research public primary documentation from multiple learning sites; record sources, observations and limitations.
- Implement the smallest justified frontend-only improvement, or document keeping the existing interface if it wins.
- Preserve API payload, idempotency, server validation, start/resume, edit/harder links, all-filter semantics, content/privacy boundaries.
- Tests, QA, independent review, recap and PR.

## Out of Scope

Authentication, database/schema, question bank, scoring/session algorithms, AI, new modes, unrelated page redesign, deployment, automatic merge.

## Acceptance Criteria

- [x] Comparison covers >=3 learning platforms with primary links; decision distinguishes evidence from inference and does not claim usability testing with humans.
- [x] Normal setup remains about3–5 interactions; no wizard or forced navigation.
- [x] Topics are easier to find/select; search cannot silently change practice scope, hidden selected topics remain visible/removable.
- [x] Existing subject/topic/multiple-level/type/category/count/hints/feedback options and all-filter keyboard behavior work.
- [x] Availability/summary stays truthful; empty/insufficient selection clear, no silent difficulty changes.
- [x] Edit configuration survives UI grouping; duplicate protection, retry, first question and refresh unchanged.
- [x] Desktop/mobile/keyboard checks, unit/integration/E2E/typecheck/lint/build pass.
- [ ] Independent QA/review, latest main sync, commit/push/PR ready; recap updated; no merge.

## Repository Findings

- Base origin/main7f2ce7e includes human merge of content PR#4;742 questions/64 topics now in main.
- Only unrelated untracked.idea; preserve.
- PracticeBuilder client uses only topic title/id/subject and question difficulty/type/tags (no answers).
- PracticeSetup server hydrates initial saved config and topic/subject links.
- Existing fieldset/FilterSelectAll keyboard semantics, request-key retries and in-flight ref are working.

## Technical Plan

### Frontend

Owner: root FRONTEND after research decision.
Files: practice-builder.tsx, scoped styles in globals.css; practice-topic-search.ts and tests; filter-select-all.tsx visible names (component used only here).
Deliverable: improve presentation/selection only, reuse controls and start handler.

### Backend / Database / Content

Owner: none. No mutation or redesign required.

### Research

Owner: independent UX research agent; public primary sources, read-only. Root records decision.

### QA / Review

Owner: separate QA agent owns new browser test file; independent reviewer reads final diff. Root owns shared reports and existing-test adaptations.

## Risks

Search bulk-select changes hidden scope; clearing last topic unexpectedly means all; collapsed filters hide active restrictions; saved config changes; sticky controls obscure mobile content; unstable native label selectors; misleading preset active state; overlap with another developer.

## Test Plan

### Unit

Existing filter-selection and practice tests; pure search/selection helpers if introduced.

### Integration

Existing practice API/service/DB suite unchanged.

### E2E / Manual

Baseline and final screenshots desktop/mobile; subject/topic search/bulk/add/remove/clear, presets, advanced options, edit/retry/start/persistence; all practice-start regressions.

## Implementation Log

- 2026-10-06: Intake/repo audit; base main fast-forwarded from human merge. Independent primary-source research recommends a single-page refinement, not a wizard. Decision: `.tasks/research/practice-builder-selection.md`. QA is capturing baseline before root frontend implementation.
- Baseline audit1/1 PASS; root visually inspected desktop/mobile screenshots. Implemented frontend refinement; no fixed mobile overlay, no API/start handler changes. Search helper3/3 tests and typecheck PASS. Independent QA and reviewer assigned; full checks pending.
- 2026-10-07: Safe resume after interruption; no stale browser test processes. Fixed fixturecallback lint issue, explicit subject accessible name, preset descriptions and scoped search padding. After fresh main sync:51/51 unit,26/26 integration,typecheck/lint PASS; QA4/4 browser cases PASS, fifth recovery case and final screenshots pending. Reviewer no production blocker/major; no backend/schema/content changes.
- Final verification: new5/5 E2E and repeatmobile1/1; old19/19 regression E2E after precise topic-checkbox selector fix. Typecheck/lint final PASS, productionbuild PASS, Prisma validate PASS, diff check PASS. Separate QA PASS and reviewer APPROVE. Details `.tasks/qa/practice-builder-selection.md`; ready for commit/push/PR.

## QA Result

Status: PASS
Details: `.tasks/qa/practice-builder-selection.md`;51unit/26integration/24relevantE2E; TypeScript/lint/build/schema/diff PASS, desktop/mobile/dark/keyboard/screens verified.

## Review Result

Status: APPROVE
Findings: no unresolved findings; independent reviewer verified corrected search padding, described preset controls and unavailable-category recovery coverage.

## Sync With Main

Latest origin/main fetched:2026-10-07,7f2ce7e
Merged into task branch:created from fast-forward main; fresh git merge origin/main Already up to date
Conflicts:none
Checks rerun after sync:51unit,26integration,5new/19existing E2E, typecheck/lint/build/Prisma/diff passed

## Result

Commits:20c01d0 (frontend and tests); documentation/publication pending
PR:pending
Known limitations:public documentation/screens only, no account-based competitor usability tests or measured human outcomes
Follow-up:commit/push task branch and prepare PR; human review/merge and eventual usability feedback only
