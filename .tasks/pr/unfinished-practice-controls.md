## Goal

Make every unfinished practice session discoverable and give learners explicit Continue / Finish early controls, including old protected sessions that block Tutor.

## Changes

- `/practice` lists all owned unfinished sessions, ten cards at a time, with date/mode/completed count and Tutor-blocking badge.
- Continue preserves session identity. Finish early is available in the list and session page, with irreversible-action confirmation, keyboard focus, pending/error/retry states.
- Tutor identifies the specific blocking session and links to continuation and the full management list.
- Small authenticated owner-scoped finish action uses existing user-row serialization; repeated calls preserve completion timestamp. New answers/hints cannot alter a closed session.
- Completed results survive; incomplete questions remain unassessed. Early summary excludes skipped questions from scoring and does not invent wrong answers.
- No schema/migration, auth architecture, AI provider, content-bank or mastery formula changes. No real user sessions automatically closed.

## Verification

- Typecheck, lint and production build PASS.
- Unit 62/62; integration 48/48 (eight new finish cases).
- E2E 15/15: six finish scenarios + nine Tutor regressions, including mobile/keyboard, old-session discovery, durable resume, duplicate/lost-response finish, partial summary, auth/origin/ownership and Exam protection.
- Independent review APPROVE; confirmation focus finding fixed. Existing Tutor locator updated for the added session notice.
- `origin/main` integrated at `36a7add` without conflicts. Production build result is recorded in `.tasks/qa/unfinished-practice-controls.md`.

## Safety / limitations

Existing completed exam results become visible only after explicit terminal closure. Skipped items are not counted as assessment; historical incorrect attempts remain reviewable. No live AI/Telegram or production deployment claims. Owned session metadata is fetched together with ten-at-a-time rendering; server pagination can be added if personal histories become very large.

Human review and merge only. No auto-merge.
