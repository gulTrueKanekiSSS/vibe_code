<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# StudySpace AI Company — Operating Rules

These rules are mandatory for every Codex session in this repository.

The human developer may describe work informally, in Russian or English. The human is not required to write formal engineering tickets, select files, choose APIs, define tests, or translate requests into technical language.

For every non-trivial request, Codex must first normalize the request into a safe engineering task and then follow the company workflow.

## 1. Natural-language intake

Examples of valid requests:

- `после обновления практика начинается заново, исправь`
- `сделай нормальную статистику после практики`
- `добавь больше сложных задач по матрицам`
- `телеграм логин опять сломался`
- `хочу чтобы после изучения темы предлагались задачи по ней`

Do not ask the human to rewrite these as technical specifications.

For substantial work determine:

- Goal
- User problem
- Expected behavior
- Scope
- Out of scope
- Relevant subsystem
- Likely implementation areas
- Acceptance criteria
- Risks
- Required tests
- Database impact
- Content impact
- Workstream ownership

Inspect the repository before asking technical questions.

Ask the human only when a genuine product decision is ambiguous and cannot be inferred from the repository or existing specification.

## 2. Company workflow

For substantial requests:

```text
Human request
    ↓
PM / Intake
    ↓
Normalized task
    ↓
Repository inspection
    ↓
Tech Lead plan
    ↓
Workstream assignment
    ↓
Implementation
    ↓
QA
    ↓
Independent review
    ↓
Sync with origin/main
    ↓
Tests again
    ↓
Commit + push
    ↓
Pull Request
    ↓
Human merge
```

For tiny typo/style fixes this may be abbreviated, but Git safety rules still apply.

Role instructions:

```text
agents/PM.md
agents/TECH_LEAD.md
agents/FRONTEND.md
agents/BACKEND.md
agents/DATABASE.md
agents/CONTENT.md
agents/QA.md
agents/REVIEWER.md
```

## 3. Sources of truth

Before a broad repository scan, read `PROJECT_RECAP.md` if it exists. Use it to choose the relevant files, then verify current Git state and those files. The recap is a navigation cache, not a replacement for the sources of truth below.

Before substantial work inspect:

```text
README.md
AGENTS.md
```

When work affects learning, practice behavior, theory, question generation, mastery, XP, Practice GPA, curriculum, or content architecture, also read:

```text
STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md
```

For content-bank expansion also inspect `CONTENT_EXPANSION_PROGRESS.md` if it exists.

Do not silently replace repository decisions with generic best practices.

## 4. Internal task files

For substantial tasks create one task file under:

```text
.tasks/active/
```

Use `TASK_TEMPLATE.md`.

Recommended filename:

```text
<task-slug>.md
```

Do not use a shared central task counter or shared task index; that becomes a merge-conflict hotspot.

When the task is complete, move its file to `.tasks/done/`.

## 5. Git safety

Never work directly on `main`.

Never commit directly to `main`.

Never push directly to `main`.

Never automatically merge a Pull Request into `main`.

Every independent task uses its own branch/worktree.

Recommended branch format:

```text
<owner>/<type>/<slug>
```

where type is one of:

```text
feature
fix
content
refactor
test
chore
```

Examples:

```text
dima/feature/custom-practice
dima/fix/practice-resume
friend/content/math-analysis
```

Determine the owner from the collaboration context. If no owner convention exists, derive a short stable slug from local Git identity. Only ask the human if it cannot be determined safely.

## 6. Before implementation

Run:

```bash
git status
git branch --show-current
git fetch origin
git log --oneline -8
```

Confirm:

- existing local changes are understood;
- the task is not being implemented directly on `main`;
- the branch belongs to the task;
- the branch is based on recent `origin/main`.

For a new branch:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b <owner>/<type>/<slug>
```

For an existing task branch:

```bash
git fetch origin
git checkout <branch>
git merge origin/main
```

Never overwrite another developer's uncommitted work.

## 7. Parallel development

Assume another human and another Codex may be working on the repository at the same time.

Therefore:

- one task = one branch;
- one branch = one clear purpose;
- do not revert unrelated changes;
- do not delete unfamiliar code without understanding ownership;
- do not perform broad refactors during narrow feature work;
- do not modify unrelated subjects/content;
- avoid two active agents editing the same sensitive files concurrently.

Parallelize only genuinely independent workstreams.

If two workstreams need the same core file, serialize them or assign one owner.

## 8. Prisma / database exclusive ownership

Only one active task may modify:

```text
prisma/schema.prisma
prisma/migrations/
```

at a time.

Before Prisma changes:

```bash
git fetch origin
git log origin/main -- prisma/schema.prisma prisma/migrations/
```

If another active task is expected to change Prisma, stop database work and report the dependency.

Never:

- delete a migration already shared in `origin/main`;
- rewrite shared migration history;
- rename old migrations;
- create competing migrations for the same change;
- reset a shared database automatically.

For Prisma work run at minimum:

```bash
npx prisma validate
```

plus relevant repository DB checks.

## 9. StudySpace content safety

Preserve the established content structure:

```text
content/subjects.json
content/lessons/
content/questions/
```

When adding questions/content:

- preserve stable existing IDs;
- do not change the meaning of a question ID that may already have user results;
- create a new ID for materially changed questions;
- follow neighboring files as schema examples;
- include correct answer, explanation, progressive hints, and full solution where required;
- validate every answer;
- avoid fake variety that only changes numbers;
- follow the university-grounded master specification;
- do not copy university tasks verbatim into generated public practice.

Prefer subject/topic ownership so two Codex agents do not edit the same files.

## 10. Scope discipline

Before implementation:

1. inspect relevant code;
2. inspect nearby tests;
3. inspect related schema/data;
4. identify the smallest safe change;
5. record acceptance criteria;
6. identify regressions to protect against.

Do not redesign stable architecture unless the task requires it.

Do not rewrite working systems simply because another design is possible.

## 11. Role separation

For substantial tasks, separate creation from verification.

Implementation roles may be Frontend, Backend, Database, or Content.

QA verifies behavior and acceptance criteria.

Reviewer independently inspects the final diff.

If true separate agents are unavailable, explicitly switch roles and perform an independent QA/review pass rather than treating implementation as automatically correct.

## 12. Required checks

Use the repository's documented commands.

For substantial code changes, run the applicable checks:

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
```

For Prisma changes also run:

```bash
npm run db:generate
npx prisma validate
```

For relevant browser flows:

```bash
npm run test:e2e
```

For content-only changes, run the repository's content/seed validation and relevant tests.

Never claim a check passed unless it actually ran successfully.

If a check cannot run, report the exact reason.

## 13. Before every commit

Inspect:

```bash
git status
git diff
git diff --staged
```

Confirm every changed file belongs to the task.

Never commit secrets, `.env`, `.env.local`, Telegram credentials, API tokens, private keys, local DB files, temporary logs, or build output unless intentionally tracked.

## 14. Forbidden destructive Git operations

Do not use these unless a human explicitly approves:

```bash
git reset --hard
git clean -fd
git push --force
git push --force-with-lease
git checkout -- .
git restore .
```

Do not rewrite published history or discard another developer's local work.

## 15. Commit quality

Prefer small, logical commits.

Good examples:

```text
feat(practice): persist custom practice sessions
fix(practice): prevent duplicate session creation
content(agla): add determinant challenge questions
test(practice): cover resume after refresh
chore(prisma): add practice session metadata
```

Avoid vague messages such as `changes`, `update`, `stuff`, `fix`, `final`.

## 16. Sync before completion

Before a task can be considered complete:

```bash
git fetch origin
git merge origin/main
```

Resolve conflicts in the task branch, never in `main`.

When resolving conflicts:

1. inspect both sides;
2. understand both changes;
3. preserve valid work from both developers;
4. never blindly choose `ours`;
5. never blindly choose `theirs`;
6. rerun relevant checks.

If the merge requires a product/architecture decision, stop and ask the human.

## 17. Pull Request gate

After QA and review:

```bash
git push -u origin <branch>
```

Create a Pull Request into `main`.

The PR must summarize:

- normalized task goal;
- user-visible behavior;
- files/areas changed;
- tests/checks run;
- migrations, if any;
- content counts/coverage, if relevant;
- known limitations/risks;
- manual verification;
- whether latest `origin/main` was integrated.

Do not auto-merge.

The human owns the final merge.

## 18. Definition of Done

A non-trivial task is done only when:

- the informal request has been normalized;
- acceptance criteria are explicit;
- implementation is complete;
- unrelated code was not modified;
- latest `origin/main` has been integrated;
- relevant checks pass or blockers are documented;
- QA has verified acceptance criteria;
- Reviewer has inspected the final diff;
- changes are committed;
- branch is pushed;
- Pull Request is ready for human review;
- no automatic merge was performed.

## 19. When uncertain

Prefer stopping and reporting uncertainty over making destructive assumptions.

Especially stop before deleting migrations, rewriting authentication, changing shared schema while another task may also change it, removing another developer's code, force-pushing, altering deployment/secrets strategy, or making a product decision with multiple materially different UX outcomes.

## 20. Persistent project recap

After every completed logical batch of changes, update the separate `PROJECT_RECAP.md` before handing work back to the human. Also record unfinished work and the exact next step when stopping with a blocker. A chat summary alone is not sufficient.

Keep the recap compact and useful for the next session:

- date, task/branch and last verified base commit;
- what changed and the relevant file paths;
- important decisions and constraints;
- checks actually run, their results, and checks not run;
- remaining limitations/blockers and the exact next step;
- links to detailed task/content reports instead of copying their full history.

Before scanning the whole project, start with this recap, inspect Git status/recent changes, and read only the relevant source files. Broaden inspection when the recap is missing, stale, inconsistent or insufficient. Mandatory source/role instructions and verification still apply; previous successful checks are not evidence that the current tree passes.

Update only relevant recap sections, preserve other contributors' valid entries, and keep detailed history in task-specific reports. Do not turn the recap into a shared task counter or task queue. Never include secrets, credentials, private user data or environment-file contents.
