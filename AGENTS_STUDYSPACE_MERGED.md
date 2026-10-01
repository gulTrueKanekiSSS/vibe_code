<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# StudySpace Collaboration Rules

This repository is developed in parallel by multiple human developers using separate Codex agents.

These rules are mandatory for every Codex session in this repository.

## Git safety

Never work directly on `main`.

Never commit directly to `main`.

Never push directly to `main`.

Never automatically merge a Pull Request into `main`.

Every independent task must use its own branch.

Recommended branch names:

- `feature/<task>`
- `fix/<task>`
- `content/<subject-or-topic>`
- `refactor/<scope>`
- `test/<scope>`
- `chore/<scope>`

Examples:

- `feature/custom-practice`
- `fix/practice-start`
- `content/math-analysis`
- `content/programming-pointers`
- `chore/prisma-practice-session`

## Assume parallel development

Assume another developer and another Codex agent may be working on the repository at the same time.

Therefore:

- do not overwrite unrelated changes;
- do not revert changes you did not create;
- do not delete code because it looks unfamiliar;
- do not modify unrelated files;
- do not perform broad refactors while solving a narrow task;
- preserve valid work from other developers.

If an unrelated change appears in the working tree, inspect it before touching it.

## Before starting a task

Run:

```bash
git status
git branch --show-current
git fetch origin
git log --oneline -8
```

Confirm:

- the working tree is clean, or all existing changes are understood;
- the current branch is not `main`;
- the branch belongs to the current task;
- `origin/main` has been fetched recently.

If currently on `main`, create a task branch before editing.

Typical flow:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b <branch-name>
```

If the task branch already exists:

```bash
git fetch origin
git checkout <branch-name>
git merge origin/main
```

## One task = one branch

Do not mix unrelated work into one branch.

Good:

```text
feature/custom-practice
content/math-analysis
fix/practice-session-resume
```

Bad:

```text
big-update
everything
new-stuff
```

## StudySpace source of truth

For substantial product/content work, read the relevant project documentation first.

Primary product/content specification:

```text
STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md
```

For content-bank work, also inspect:

```text
CONTENT_EXPANSION_PROGRESS.md
```

if it exists.

The repository README documents the current implementation and commands. Preserve it as the project README.

## Scope discipline

Before changing code:

1. inspect the relevant implementation;
2. inspect nearby tests;
3. inspect related schema/data;
4. identify the smallest correct change;
5. avoid unrelated cleanup.

Do not redesign architecture unless the task explicitly requires it.

Do not rewrite working functionality simply because another implementation is possible.

## Prisma / database lock rule

Only one active task may modify these at a time:

```text
prisma/schema.prisma
prisma/migrations/
```

Before changing Prisma:

```bash
git fetch origin
git log origin/main -- prisma/schema.prisma prisma/migrations/
```

If another active branch is expected to change schema or migrations, stop and coordinate with the human developers.

Never:

- delete a migration already present in `origin/main`;
- rewrite shared migration history;
- rename old migration folders;
- create competing migrations for the same schema change;
- reset a shared database automatically.

For Prisma-related work run:

```bash
npx prisma validate
```

and the relevant project migration/status commands.

## Content conflict reduction

The repository already separates content by subject/topic. Preserve that structure.

Current content locations include:

```text
content/subjects.json
content/lessons/
content/questions/
```

Prefer editing only the subject/topic assigned to the current task.

Do not move unrelated subjects into one giant shared file.

If both developers work on content, divide work by subject whenever possible.

## Question/content rules

When adding learning content:

- preserve stable existing IDs;
- do not change the meaning of an existing question ID that may already have user results;
- create a new ID for materially changed questions;
- follow neighboring lesson/question files as the schema/template;
- keep university-grounded difficulty and terminology;
- validate answers, hints, explanations, and full solutions;
- avoid fake variety that only changes numbers.

For content work, follow `STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md`.

## Secrets

Never commit:

```text
.env
.env.local
.env.production
.env.development.local
```

Never commit:

- Telegram secrets;
- API tokens;
- database credentials;
- private keys;
- passwords.

Use `.env.example` for variable names only.

## Forbidden Git commands

Do not use these unless a human explicitly approves:

```bash
git reset --hard
git clean -fd
git push --force
git push --force-with-lease
git checkout -- .
git restore .
```

Do not discard another developer's uncommitted work.

Do not rewrite published branch history unless explicitly requested.

## Commit rules

Prefer small, logically grouped commits.

Good examples:

```text
feat(practice): add multi-topic custom practice
fix(practice): prevent duplicate session creation
content(agla): add determinant challenge questions
content(programming): add pointer tracing explanations
test(practice): cover session resume after refresh
chore(prisma): add practice session metadata
```

Avoid vague messages such as:

```text
changes
update
stuff
fix
final
```

## Required checks

Use the checks documented by this repository.

For substantial code changes, run the applicable commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
```

For Prisma-related work also run:

```bash
npm run db:generate
npx prisma validate
```

Run `npm run db:migrate` only when the task actually includes migrations and the environment is appropriate.

For browser flows, when relevant:

```bash
npm run test:e2e
```

Do not claim a check passed unless it was actually run successfully.

## Before every commit

Inspect:

```bash
git status
git diff
git diff --staged
```

Confirm all changes belong to the current task.

Do not commit temporary logs, local databases, build output, or unrelated generated files unless the repository intentionally tracks them.

## Synchronize before finishing

Before declaring a task complete:

```bash
git fetch origin
git merge origin/main
```

Resolve conflicts in the task branch, never in `main`.

When resolving conflicts:

1. inspect both versions;
2. understand why each change exists;
3. preserve valid work from both developers;
4. never blindly choose "ours";
5. never blindly choose "theirs";
6. rerun relevant checks after resolution.

If the conflict is ambiguous or architectural, stop and ask the human developer.

## Push and Pull Request

After verification:

```bash
git push -u origin <branch-name>
```

Create a Pull Request into:

```text
main
```

The PR should include:

- what changed;
- why;
- major files touched;
- tests/checks run;
- migrations created, if any;
- known limitations;
- manual verification performed.

Do not merge the PR automatically.

A human performs the final merge.

## After another PR is merged

If another developer's PR is merged while this task is still active:

```bash
git fetch origin
git merge origin/main
```

Then resolve conflicts and rerun relevant checks.

Do not continue for a long time on a stale base if `main` has materially changed.

## Definition of done

A task is complete only when:

- the requested implementation/content is finished;
- unrelated code was not modified;
- latest `origin/main` has been integrated;
- conflicts are resolved carefully;
- relevant checks pass;
- changes are committed;
- the branch is pushed;
- a Pull Request is ready for human review;
- no automatic merge was performed.

## When uncertain

Prefer stopping and reporting uncertainty over making destructive assumptions.

Especially stop before:

- deleting migrations;
- rewriting authentication;
- changing shared schema while another branch may also change it;
- removing another developer's code;
- force-pushing;
- changing deployment configuration;
- altering secrets/environment strategy.
