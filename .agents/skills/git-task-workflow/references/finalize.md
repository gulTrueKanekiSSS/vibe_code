# Verify, synchronize and publish

## Verification gates

For substantial work, load `agents/QA.md` and verify acceptance criteria using its impact matrix.
Then load `agents/REVIEWER.md` for an independent final diff review; report blockers honestly.
Fix required findings and rerun affected checks. Small tasks may abbreviate role passes,
but still need proportionate verification and diff inspection.

Before declaring a substantial task complete:

    git fetch origin
    git merge origin/main

Inspect both sides of conflicts and preserve valid work from both developers; never blindly
choose ours/theirs. Stop for unresolved product/architecture decisions. Repeat affected
verification and review if synchronization changes the task; record base and outcome.

## Commit preparation

Update the task's QA/review/sync results and the recap as required by AGENTS.md.
Inspect `git status` and `git diff`, then stage explicit task paths, never unrelated or secret/generated files.
Inspect `git diff --staged` after staging and before every commit; every staged file must belong to this task.
Prefer small logical commits with descriptive intent, e.g. `fix(practice): preserve active session`.
Do not rewrite published history.

## Authorized publication

Publishing requires user/task authority; this skill does not infer it from diagnosis or review.
If authorized and verification gates pass (or the human explicitly accepts documented blockers):

    git push -u origin <task-branch>

Create a PR into main without merging it. Include goal, user-visible behavior, areas changed,
actual checks/manual verification, migrations/content counts if relevant, limitations/risks,
and whether latest origin/main is integrated. Reuse an existing PR for this same task.
Use available authenticated tooling without printing credentials; do not alter auth strategy.
If push/PR tooling is unavailable, record the exact blocker and hand off the PR body.

## Close or hand off

When implementation, relevant QA, independent review, main sync, commit/push and PR handoff
are complete, move the task file to `.tasks/done/` and update recap links/PR status.
The human owns final merge. A ready PR is not a merged PR.
If unfinished, leave the task active with the blocker and exact next step; do not mark done.
