# QA — unfinished practice controls

Date: 2026-10-10. Branch `dmitrij/fix/unfinished-practice-controls`, base `36a7add`.
QA authored isolated browser fixtures; root completed their execution after an agent interruption. Backend separately tested serialization/scoring; independent reviewer inspected the final source and approved it.

## Checks actually run

Commands use `PATH="$PWD/node_modules/.bin:$PATH"` (Node 22).

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS, including final post-focus/test updates |
| `npm run lint` | PASS |
| `npm test` | PASS 62/62 |
| `npm run test:integration` | PASS 48/48, including 8 new finish cases |
| `npm run test:e2e -- e2e/practice-finish.spec.ts e2e/tutor.spec.ts` | PASS 15/15: six finish scenarios + nine Tutor regressions |
| `git diff --check` | PASS |
| `npm run build` | PASS, Next 16.3.6 webpack, exit 0; generated next-env path-only changes restored to tracked dev paths |
| Prisma/schema/migration checks | Not applicable: no schema or migration changes |
| `git fetch origin` + `git merge origin/main` | Already up to date at `36a7add`, before final regression/build |

## Acceptance / regressions

- Old protected session behind 11 newer sessions becomes visible using Show more; list exposes date/mode/completed counts/protection badge. Continue keeps same ID and first question across refresh, creates no extra session.
- Tutor points to the precise owned blocking session and to the full management list. Protected modes remain disabled until terminal closure; missing AI credentials remain a separate unavailable state afterward.
- Confirmation cancellation leaves data untouched. Keyboard focuses Cancel on opening and restores trigger on cancellation; mobile 390px has no horizontal overflow.
- Duplicate clicks submit once; lost successful response retries against the original session without rewriting its first completion timestamp.
- Finished session remains closed on reload. Stale fresh answers/hints cannot mutate it. Accepted submission replay remains read-only.
- Closing untouched sessions creates no assessed questions/XP/mastery/GPA; closing partial normal/exam sessions preserves completed results and excludes incomplete questions from evidence. Actual wrong attempts are preserved, not invented for skipped items.
- Browser verifies partial summary denominator (one completed, one skipped), untouched summary has no invented mistakes, no active answer controls after closing.
- Real endpoint rejects anonymous/cross-origin/foreign-owned/malformed requests. Service tests cover owned missing sessions, concurrent finish and queued answer/finish ordering.
- Other protected sessions still block Tutor until each is explicitly closed. Existing full practice/progress/leaderboard suites remained green.

## Findings fixed

- Independent review caught lost keyboard focus on confirmation replacement; focus management added and E2E verified.
- Existing Tutor regression used an ambiguous `.tutor-notice` locator after adding the blocker card. Failure reproduced; selector now addresses the status notice and also asserts both new navigation links. All three protected-mode regressions pass.

## Limitations / scope

No production deployment, live AI calls, schema migration or actual Telegram login test. Browser auth uses isolated test cookies; teardown deletes only those fixture users. No real user sessions were automatically closed. The list fetches owned metadata and reveals ten cards at a time; very large histories may later require server pagination. Human review/merge remains required.

Final engineering QA: PASS. Independent source review: [APPROVE](unfinished-practice-controls-review.md). Publication status is in the task and recap.
