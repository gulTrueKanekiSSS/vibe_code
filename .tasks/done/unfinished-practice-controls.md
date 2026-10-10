# Unfinished practice controls

Status: DONE — PR ready for human review
Branch: dmitrij/fix/unfinished-practice-controls
Owner: Codex; base origin/main 36a7add (Tutor PR #7 merged by human).

## Request / goal

User cannot see an old unfinished protected practice session that blocks Tutor. Every unfinished session must offer Continue and Finish early through the UI.

## Scope / acceptance

- [x] All unfinished owned sessions discoverable (not only latest three), with date/mode/completed count and Tutor-blocking status.
- [x] Continue preserves the existing session; Finish early requires explicit confirmation and prevents duplicate submission.
- [x] Existing session page also offers early finish; Tutor blocked notice offers a route to the sessions responsible.
- [x] Server finish is authenticated, owner-scoped, serialized/idempotent; closed sessions cannot accept new answers/hints.
- [x] Preserve completed results and XP; untouched/incomplete items do not become completed or invented mistakes. Summary distinguishes early finish from full completion.
- [x] Closing last protected session removes Tutor block; another protected session still blocks it.
- [x] Relevant unit/integration/E2E + typecheck/lint/build, independent review, latest-main sync and PR without auto-merge.

## Findings / plan

Practice page takes only latest 3 unfinished sessions, while Tutor checks all protected sessions. No explicit early finish endpoint; finishedAt is set only after all items completed. Existing progress queries use item.completedAt. Existing answer/hint handlers need closed-session guards to make early finish irreversible.

No schema/migration/auth/content changes. Use existing finishedAt; infer early finish from remaining incomplete items. Keep those item records untouched. Completed exam results become visible after explicitly closing the exam, as for normal completion. Denominators and mistake review must not treat skipped items as failed attempts.

Backend agent exclusively owns practice-service.ts, practice API and new integration/practice-finish.test.ts. Root owns UI controls/list, session summary, Tutor blocked-navigation, task/recap. QA/reviewer independently check final changes. Do not change real users' sessions as part of implementation; tests use isolated owned fixtures.

## Checks / result

Implemented all controls and narrow server finish action, preserving existing session/learning architecture. No schema changes. Source review APPROVE; focus finding repaired and browser-verified. Existing Tutor selector corrected for the additional session card (no disabled-mode security change).

PASS: typecheck, lint, 62 unit, 48 integration, 15 E2E (six finish + nine Tutor), production build. Main synchronized at `36a7add` without conflicts. [QA](../qa/unfinished-practice-controls.md), [independent review](../qa/unfinished-practice-controls-review.md).

Implementation commit `3e9a6b46dfbe982dfccb7e1ab23b99ac1cfb304f` pushed to the dedicated branch. [PR #8](https://github.com/gulTrueKanekiSSS/vibe_code/pull/8) is open into main, not merged. Next: human review/merge and deployment as appropriate; user can explicitly continue or close the old session in `/practice#unfinished-sessions`. No real user session was automatically closed; no schema migration is needed.
