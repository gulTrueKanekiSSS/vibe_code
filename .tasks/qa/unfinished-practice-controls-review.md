# Independent review — unfinished practice controls

Date: 2026-10-10. Branch: `dmitrij/fix/unfinished-practice-controls`.
Reviewed base: `36a7add` (human merge of Tutor PR #7).
Decision: **APPROVE**. No outstanding BLOCKER or MAJOR findings.

## Scope and acceptance coverage

Independently inspected the current diff, new finish/list/helper components, finish integration tests and browser tests; traced existing practice serialization, session hydration, progress/leaderboard evidence filters and Tutor ownership/protection checks. No application files were changed by this reviewer.

- All owned unfinished sessions are fetched with safe metadata; ten-at-a-time display has a discoverable Show more control. Continue reuses the existing ID. Tutor identifies an owned blocking session and links both to it and to the list.
- Early finish requires explicit irreversible-action confirmation. A synchronous pending guard and disabled controls prevent duplicate client submissions; failed requests allow retry.
- API retains authenticated same-origin admission, strictly validates the new action and delegates to owner-scoped finish logic. Missing/foreign sessions do not mutate data.
- Finish uses the same per-user transaction lock as answers/hints. Repeated finish preserves the first timestamp. New answers/hints on closed sessions are rejected; existing submission/completed-item replays remain read-only.
- Only `PracticeSession.finishedAt` changes. Completed item results/XP remain intact; unfinished items, attempt history and progress rows are not fabricated or rewritten. Existing completed-item filters continue to govern mastery/GPA/leaderboard evidence.
- Summary explicitly identifies early closure, excludes incomplete items from assessment denominators and does not invent mistakes for untouched questions. Real incorrect attempts remain available for review. Exam results are revealed only after terminal closure; no new pre-close answer disclosure was introduced.
- Tutor stays protected while any other protected session remains unfinished. No schema, migration, authentication, question-bank or provider changes are needed.

## Finding resolved during review

**MINOR — keyboard focus, `src/components/finish-practice.tsx`:** opening confirmation removed the focused trigger and cancellation removed the focused Cancel control. Author added deliberate focus on Cancel when confirmation opens and restoration to the trigger when it closes, without stealing focus on initial render. Reviewer inspected the fix; the updated browser tests assert both focus transitions.

## Verification evidence and remaining gates

- Personally executed: `git diff --check` PASS; inspected branch/base/status and relevant source/test changes.
- Backend/root-reported checks on this worktree: 8 focused finish integration cases; full 62 unit / 48 integration tests, typecheck and lint PASS. These were not independently rerun by the reviewer.
- QA initially reported 4/4 new E2E PASS; root subsequently reported the strengthened 5/5 finish E2E PASS, including >10-session discovery, durable resume, cancellation/duplicate submission, mobile keyboard focus, lost-response retry and actual API auth/origin/ownership/input rejection.
- At handoff, root is refining an existing Tutor test selector for the intentionally added second notice, then must finish affected regression verification, production build, latest-main synchronization and authorized commit/push/PR handoff. This approval does not claim those pending checks have passed.
- Browser fixtures use isolated accounts; no real user session was closed by review. No live AI or Telegram-login validation is claimed. Unrelated `.idea/` remains outside the task.
- Human performs the final merge; approval never authorizes automatic merge.
