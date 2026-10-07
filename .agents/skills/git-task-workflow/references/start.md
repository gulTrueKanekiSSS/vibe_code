# Start or resume a task

## Establish state

Use the recap and targeted sources. Run:

    git status
    git branch --show-current
    git fetch origin
    git log --oneline -8

Understand local changes, branch purpose and base before mutation. Preserve unrelated work.
If interruption involved a terminal, verify process state; do not trust a stale session.
Never stash, delete or overwrite somebody else's work to make switching branches convenient.
If another task is active in this worktree, use a separate worktree or stop for ownership.

## Normalize and record

For substantial work, create `.tasks/active/<task-slug>.md` from `TASK_TEMPLATE.md`.
Record goal, expected behavior, scope/non-goals, acceptance criteria, regression tests,
risks, DB/content impact and ownership. Omit inapplicable template workstreams.
Do not create a central task counter/index. Use PM/Tech Lead only for genuine complexity.
Select the smallest safe change from relevant code, tests and data; no unrelated refactors.

## Branch setup

Use `<owner>/<feature|fix|content|refactor|test|chore>/<slug>`.
Derive owner from collaboration convention or local Git identity; ask only if unsafe to infer.
With a safely switchable worktree, create a new task branch:

    git checkout main
    git pull --ff-only origin main
    git checkout -b <owner>/<type>/<slug>

These commands only synchronize main; implementation starts on the new task branch.
For an existing branch, verify it owns this task, then:

    git checkout <task-branch>
    git merge origin/main

Do not reuse a completed task branch for an independent task. If the worktree cannot switch
safely, create a dedicated worktree from origin/main rather than discarding local changes.
Record base commit and known dependencies in the task.
