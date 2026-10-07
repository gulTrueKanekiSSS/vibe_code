## Goal

Make configuring existing custom practice easier to scan and select, based on public primary documentation from Quizlet Test, Khan Academy, Brilliant and NN/G. Preserve the working session architecture; no wizard or additional product modes.

## User-visible changes

- Editable intent cards describe level, size, hints and feedback; active state follows actual settings.
- Subject-grouped topic rows with search, question-bank counts and curriculum labels.
- Selected-topic chips remain visible/removable outside search; separate global/found-results bulk actions and explicit all-topics scope.
- One advanced disclosure for categories, answer types, hints and feedback; session summary reflects active restrictions even when closed. Saved configurations open advanced controls.
- Desktop sticky summary/start; mobile normal flow without overlays. Empty/insufficient filters remain explicit; unavailable selected categories can be removed.

## Safety and scope

`PracticeBuilder`, scoped global styles, existing select-all visible labels and a pure search helper only. API/start/request-key/duplicate/retry/session/scoring/auth unchanged; no hidden answers passed to client. No schema/migrations, seed, content-bank or AI changes. Bank remains742 questions across64 topics.

## Verification

- 51 unit and26 integration tests PASS; TypeScript/lint/production build PASS, including final type/lint rerun after test-only corrections.
- 5 new browser cases PASS, mobile repeated1/1; final19 existing practice-start regressions PASS after precise checkbox-locator correction (24 relevant browser cases across both suites).
- Prisma validate/diff check PASS. Independent browser QA PASS and reviewer APPROVE; desktop light/dark,390/320px, keyboard, saved config, first question/refresh and duplicate/retry checked.

Latest `origin/main` `7f2ce7e` integrated2026-10-07, no conflicts. No automatic merge.

## Manual review / limitations

Open `/practice/custom` after login; try subject→preset→start, topic search/chips, advanced filters and editing saved configuration. Screenshots/automated browser checks are not human usability research. No deployment or real Telegram login proof; existing missing favicon404 remains unrelated. `.idea/`, environment values, generated build output and screenshots excluded.

Details: `.tasks/research/practice-builder-selection.md`, `.tasks/qa/practice-builder-selection.md`, `PROJECT_RECAP.md`.
