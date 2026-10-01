# CODEX_WORKFLOW.md — Parallel Development Workflow

This file describes how two developers using separate Codex agents should work on StudySpace without breaking each other's changes.

## Recommended Model

```text
                 GitHub
                   |
                  main
             stable branch
              /        \
             /          \
            v            v
   dima/<task>      friend/<task>
       |                 |
   Dima Codex        Friend Codex
```

No Codex agent works directly on `main`.

## Daily Start

Each developer begins with:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
```

Then create a dedicated branch:

```bash
git checkout -b feature/<task-name>
```

or:

```bash
git checkout -b fix/<task-name>
git checkout -b content/<subject-name>
```

## Good Parallel Split for StudySpace

### Developer A

Typical ownership:

```text
Practice Engine
PracticeSession
Custom Practice
XP
Mastery
Practice GPA
Telegram authentication
Prisma / database
Dashboard behavior
```

### Developer B

Typical ownership:

```text
Theory / MDX
Question Bank
Hints
Explanations
Formula Book content
Subject content
Curriculum coverage
```

The important rule is:

> Do not actively modify the same subsystem at the same time unless you have explicitly coordinated it.

## Content Work

If both developers work on content, split by subject.

Example:

```text
Developer A:
- AGLA
- Programming
- Computer Architecture

Developer B:
- Mathematical Analysis
- Logic & Discrete Mathematics
```

## Database Work

Before anyone changes Prisma, agree who owns the database change.

Example:

```text
Dima: owns Prisma changes today
Friend: does not touch schema/migrations
```

After the database PR is merged, the other developer updates from `main`.

## During the Task

Codex may:

- inspect files;
- edit files;
- run tests;
- run lint;
- run builds;
- create commits;
- push its own feature branch;
- prepare a Pull Request.

Codex must not:

- push to `main`;
- auto-merge;
- force-push;
- reset shared history;
- delete another developer's work.

## Before Opening a Pull Request

Always:

```bash
git fetch origin
git merge origin/main
```

Then:

```bash
npm run lint
npm test
npm run build
```

and relevant project checks.

Only after that:

```bash
git push -u origin <branch>
```

Create the PR.

## Merge Order Example

Two PRs are ready:

```text
PR #31 — Custom Practice
PR #32 — Math Analysis content
```

Merge PR #31 first.

Before PR #32 is merged, update its branch:

```bash
git fetch origin
git checkout content/math-analysis
git merge origin/main
```

Run checks again.
Push any merge-resolution commit.
Then review and merge PR #32.

## If a Conflict Appears

Do not choose one version blindly.

Ask:

1. What did my branch change?
2. What did `main` change?
3. Are both changes still needed?
4. Can both be preserved?
5. Does the final code still satisfy tests?

Resolve inside the feature branch.
Never resolve by overwriting `main`.

## Recommended Branch Naming

```text
feature/<task>
fix/<bug>
content/<subject-or-topic>
refactor/<scope>
test/<scope>
chore/<scope>
```

Examples:

```text
feature/custom-practice
fix/practice-start
fix/telegram-callback
content/math-analysis
content/programming-pointers
test/practice-session-resume
chore/prisma-practice-session
```

## Keep Branches Short-Lived

Prefer:

```text
1 task
→ 1 branch
→ 1 PR
→ merge
→ delete branch
```

Avoid branches that stay open for weeks and accumulate unrelated changes.

## Human Responsibility

Codex may automate most Git operations.

Humans keep control of:

- final PR review;
- final merge;
- coordination of database ownership;
- decisions when merge conflicts are ambiguous;
- secrets;
- production deployment.
