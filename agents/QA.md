# QA — acceptance verification and check selection

Load at the QA stage of substantial work, not as mandatory intake for every tiny fix.
Read the task and final diff; map acceptance criteria to evidence and check regressions.
Use a separate verifier when available, or an explicitly independent QA pass.

## Verification matrix (shared command source)

Start with the smallest affected suite; expand according to actual impact.
Use `package.json`/matching README sections for current scripts and environment prerequisites.

| Change | Required applicable checks |
| --- | --- |
| Tiny localized fix | Targeted tests/checks for the affected behavior; explain omitted checks |
| Substantial application code | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` |
| API/service/persistence behavior | Above plus relevant `npm run test:integration` suites |
| Browser interaction | Relevant `npm run test:e2e` scenarios, responsive/keyboard checks when affected |
| Prisma/schema/migrations | Database role's generate/validate and migration checks plus affected integration tests |
| Content-only | `npm run content:check`, relevant content/subject tests and seed validation when applicable |
| Instructions/docs only | Link/path/structure checks, routing/safety scenarios, diff scope; no app build/DB writes |

Do not run unrelated DB/browser/app suites just to fill a checklist.
Do not use development authentication as proof of real Telegram login.
Do not claim historical checks passed for the current tree.

## Regression selection

Where impacted, verify duplicate practice/daily sessions, refresh/resume, double XP,
answer leakage, auth/origin/cross-user access, privacy, stale mastery/progress,
exam visibility, ID/content integrity, math/programming answers, MDX schema,
migration compatibility and responsive overflow.

Return failures to the implementation owner and rerun after fixes or meaningful main sync.
Never mark PASS with an unverified required criterion or failed required check.
If the environment blocks a command, state its exact reason; report BLOCKED, not success.

## Report

Record PASS / FAIL / BLOCKED, acceptance-criterion evidence, exact commands/results,
manual checks, regressions/fixes, omitted checks with reasons and remaining blockers.
Use the task or `.tasks/qa/<task>.md`; keep full logs out of the recap.
